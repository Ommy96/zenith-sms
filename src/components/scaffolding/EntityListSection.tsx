import { ReactNode } from "react";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface EntityListSectionProps<T> {
  title?: string;
  /** Optional summary line, shown above the list (left aligned). */
  summary?: ReactNode;
  loading: boolean;
  rows: T[];
  /** Render the list body (e.g. cards grid or table rows). */
  renderList: (rows: T[]) => ReactNode;
  emptyMessage?: string;
  /** Primary action button (usually "New X"). */
  action?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
    disabled?: boolean;
  };
  /** If true, wrap content in a Card (default false — caller controls). */
  wrapInCard?: boolean;
}

/**
 * Standardized "list with header and create button" scaffold.
 * Handles loading spinner, empty state, and header layout.
 */
export function EntityListSection<T>({
  title,
  summary,
  loading,
  rows,
  renderList,
  emptyMessage = "No records yet.",
  action,
  wrapInCard = false,
}: EntityListSectionProps<T>) {
  const header = (title || summary || action) && (
    <div className="flex items-center justify-between mb-4">
      <div>
        {title && <h3 className="font-semibold">{title}</h3>}
        {summary && (
          <div className="text-sm text-muted-foreground">{summary}</div>
        )}
      </div>
      {action && (
        <Button size="sm" onClick={action.onClick} disabled={action.disabled}>
          {action.icon ?? <Plus className="h-4 w-4 mr-1" />}
          {action.label}
        </Button>
      )}
    </div>
  );

  const body = loading ? (
    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
  ) : rows.length === 0 ? (
    <Card className="p-12 text-center text-sm text-muted-foreground">
      {emptyMessage}
    </Card>
  ) : (
    renderList(rows)
  );

  if (wrapInCard) {
    return (
      <Card className="p-6">
        {header}
        {body}
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {header}
      {body}
    </div>
  );
}