// Timetable optimisation. Not implemented: needs a real constraint solver
// (e.g. Google OR-Tools) running in a companion service.
import { authedUser, authErrorResponse } from "../_shared/auth.ts";
import { corsHeaders, jsonResponse } from "../_shared/ai.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    await authedUser(req);
    return jsonResponse({
      ok: false,
      error: "not_implemented",
      message:
        "Timetable optimisation needs a constraint solver (for example Google OR-Tools) running as a companion " +
        "service. Until that is connected, use the draft generator, which places lessons greedily.",
    }, 501);
  } catch (e) {
    return authErrorResponse(e, corsHeaders);
  }
});
