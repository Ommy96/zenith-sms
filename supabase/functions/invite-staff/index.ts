import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3.25.76";
import { adminClient, authedUser, requirePermission, EdgeAuthError, authErrorResponse } from "../_shared/auth.ts";

const schema = z.object({ tenant_id: z.string().uuid(), staff_id: z.string().uuid(), role_id: z.string().uuid() });
const headers = { ...corsHeaders, "Content-Type": "application/json" };
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return reply({ error: "Method not allowed" }, 405);
  try {
    const user = await authedUser(req);
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return reply({ error: "Invalid invitation details" }, 400);
    const { tenant_id, staff_id, role_id } = parsed.data;
    // Account invitations grant roles, not merely staff-record access.
    requirePermission(user, tenant_id, "staff.manage");
    requirePermission(user, tenant_id, "users.manage");
    const admin = adminClient();
    const [{ data: staff, error: staffError }, { data: role, error: roleError }] = await Promise.all([
      admin.from("staff").select("id, tenant_id, email, first_name, last_name, user_id, status").eq("tenant_id", tenant_id).eq("id", staff_id).maybeSingle(),
      admin.from("roles").select("id, name, tenant_id, is_system").eq("id", role_id).maybeSingle(),
    ]);
    if (staffError || roleError) throw new Error("Could not verify invitation details");
    if (!staff || staff.user_id || staff.status !== "active" || !staff.email?.trim()) throw new EdgeAuthError(400, "Select an active, unlinked staff member with an email address");
    // Invitees can only receive teaching access; other roles require a separate account-management workflow.
    if (!role || !["subject_teacher", "class_teacher"].includes(role.name) || !(role.tenant_id === tenant_id || (role.tenant_id === null && role.is_system))) {
      throw new EdgeAuthError(400, "Choose a teaching role for this school");
    }
    const email = staff.email.trim().toLowerCase();
    const raw = crypto.getRandomValues(new Uint8Array(32));
    const token = Array.from(raw, (byte) => byte.toString(16).padStart(2, "0")).join("");
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
    const token_hash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
    const { error: upsertError } = await admin.from("staff_invitations").upsert({
      tenant_id, staff_id, email, role_id, token_hash, consumed_at: null,
    }, { onConflict: "staff_id" });
    if (upsertError) throw new Error("Could not prepare invitation");
    // Supabase creates the auth account before sending its invite email. The new-user hook consumes
    // this server-issued token at account creation, not on first login.
    const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { full_name: `${staff.first_name} ${staff.last_name}`.trim(), zenith_staff_invite_token: token },
      redirectTo: `${new URL(req.headers.get("origin") || "https://zenith-sms.lovable.app").origin}/auth/reset-password`,
    });
    if (inviteError) {
      await admin.from("staff_invitations").delete().eq("staff_id", staff_id).eq("token_hash", token_hash);
      throw new EdgeAuthError(400, "Invitation could not be sent. Check whether this email already has an account.");
    }
    return reply({ success: true, email_sent_to: email });
  } catch (error) {
    return authErrorResponse(error, corsHeaders);
  }
});