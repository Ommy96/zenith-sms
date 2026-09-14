import { ReactNode } from "react";
import { ShieldAlert } from "lucide-react";
import { useTenant } from "@/contexts/TenantContext";

export function RequirePermission({ permission, children }: { permission: string; children: ReactNode }) {
  const { has_permission, is_loading } = useTenant();
  if (is_loading) return null;
  if (has_permission(permission)) return <>{children}</>;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mb-4">
        <ShieldAlert className="h-6 w-6 text-muted-foreground" />
      </div>
      <h2 className="text-lg font-semibold text-foreground">You don't have access to this page</h2>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm">
        Ask your school administrator to give you the right permission, then reload this page.
      </p>
    </div>
  );
}

export default RequirePermission;
