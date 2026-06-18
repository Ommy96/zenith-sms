# Scaffolding Migration Debt

Section 8 of the Hardening Sprint introduced
`src/components/scaffolding/` (`useEntityList`, `EntityListSection`,
`EntityFormDialog`, `EntityDetailPage`). The full LOC win comes from
migrating every list-shaped tab in the modules below; this turn shipped
the abstraction plus three proof-of-concept migrations so the API can
stabilize before the bulk rewrite.

## Done this turn
- `Transport.VehiclesTab` — migrated
- `Transport.DriversTab` — migrated
- `Inventory.SuppliersTab` — migrated

## Remaining list-shaped tabs (high-confidence migrations)

### Hostel
- `HostelsTab` — partial: outer list yes, nested rooms/beds stays bespoke
- `VisitorsTab`
- `OutPassesTab`
- `RollCallsTab` — outer list only; entry sheet stays bespoke

### Transport
- `RoutesTab` — partial (outer list); nested stops stays bespoke
- `SubscriptionsTab`
- `TripsTab` — outer list only; live trip view stays bespoke
- `IncidentsTab`

### Inventory
- `StockTab` — partial (low-stock banner stays bespoke)
- `RequisitionsTab`
- `PurchaseOrdersTab`
- `AssetsTab`

### Other modules (audit candidates)
- `Library` items + loans
- `Health.visits` + `Health.immunizations`
- `Discipline.incidents` + `disciplinary_actions`
- `Communication.broadcasts` + `templates`
- `Settings.*` simple list tabs (departments, terms, etc.)

## Profile pages → EntityDetailPage
- `src/pages/StudentProfile.tsx`
- `src/pages/StaffProfile.tsx`
- `src/pages/portal/PortalStudentDetail.tsx` (if present)

## Estimated LOC reduction once fully applied
Average tab today: ~80 LOC of boilerplate (state + load + dialog wiring).
After scaffolding: ~40 LOC. ~15 tabs × ~40 LOC ≈ **600 LOC removed**
plus ~300 LOC from the two profile pages → ~900 LOC net once fully
migrated. (The original audit estimate of 1500–2000 LOC assumed
including bespoke tabs that genuinely need their own layout.)

## Migration recipe
```tsx
import {
  useEntityList,
  EntityListSection,
  EntityFormDialog,
} from "@/components/scaffolding";

const { rows, loading, refresh } = useEntityList(async () => {
  const { data, error } = await supabase.from("table").select("*")
    .eq("tenant_id", tenantId);
  if (error) throw error;
  return data ?? [];
}, [tenantId]);

const save = async () => {
  if (!form.name) { toast.error("Name required"); return false; }
  const { error } = await supabase.from("table").insert({ ... });
  if (error) throw error;        // dialog auto-toasts
  toast.success("Saved");
  await refresh();
  // form reset
};

return (
  <>
    <EntityListSection
      title="Things"
      loading={loading}
      rows={rows}
      action={{ label: "New Thing", onClick: () => setOpen(true) }}
      renderList={(items) => /* your grid/list */}
    />
    <EntityFormDialog open={open} onOpenChange={setOpen} title="New" onSubmit={save}>
      {/* form fields */}
    </EntityFormDialog>
  </>
);
```