# TypeScript Strict Mode Debt

`tsconfig.app.json` now runs with `strict`, `strictNullChecks`,
`noImplicitAny`, `noUnusedLocals`, and `noUnusedParameters` all enabled.
The full project type-checks clean at the time of writing
(`npx tsc --noEmit -p tsconfig.app.json` → 0 errors).

The remaining hygiene work is **eliminating residual `any`** types
inside otherwise-passing files. These cleanups are tracked here; they
do **not** break the build today but should be paid down so future
strict checks (e.g. `noImplicitAny` on function returns) keep biting.

## Files with explicit `any` (priority order)

High-traffic page/component files — burn these down first:

- `src/pages/AdmissionWizard.tsx`
- `src/pages/Finance.tsx`
- `src/pages/Students.tsx`
- `src/pages/Hostel.tsx`
- `src/pages/Timetable.tsx`
- `src/pages/StudentProfile.tsx`
- `src/pages/CbcAssessment.tsx`
- `src/pages/Examinations.tsx`
- `src/pages/ExamGradeEntry.tsx`
- `src/pages/Discipline.tsx`
- `src/pages/Health.tsx`
- `src/pages/Transport.tsx`
- `src/pages/Library.tsx`
- `src/pages/Messaging.tsx`
- `src/pages/Events.tsx`
- `src/components/finance/PayrollTab.tsx`
- `src/components/finance/ExpensesTab.tsx`
- `src/components/finance/BursarDashboard.tsx`
- `src/components/finance/RemindersTab.tsx`
- `src/components/messaging/ComposeTab.tsx`
- `src/components/messaging/CampaignsTab.tsx`
- `src/components/messaging/HistoryTab.tsx`
- `src/components/messaging/TemplatesTab.tsx`
- `src/components/messaging/SettingsTab.tsx`
- `src/components/academics/CalendarTab.tsx`
- `src/components/timetable/OptimizerPanel.tsx`
- `src/components/timetable/TeacherUnavailabilityPanel.tsx`
- `src/components/settings/AiSettingsTab.tsx`
- `src/components/portal/*`
- `src/contexts/TenantContext.tsx`
- `src/contexts/PortalContext.tsx`
- `src/hooks/useSetupChecklist.ts`
- `src/lib/demoSeed.ts`

## Pattern for fixing

Replace ad-hoc `useState<any[]>` / `: any` with rows derived from
`src/integrations/supabase/types.ts`:

```ts
import type { Database } from "@/integrations/supabase/types";
type StudentRow = Database["public"]["Tables"]["students"]["Row"];
const [rows, setRows] = useState<StudentRow[]>([]);
```

For joined selects, define a local `interface` describing only the
fields you actually consume — do not reach for `any`. For RPC results,
narrow to the function's documented shape.

## Rules

- New code MUST NOT introduce `any` or `// @ts-ignore`.
- Pre-commit (`tsc --noEmit`) will block regressions.
- When you fix a file, delete it from the list above and note it in
  `CHANGES.md`.