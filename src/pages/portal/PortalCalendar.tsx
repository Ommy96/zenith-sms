import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays } from "lucide-react";

export default function PortalCalendar() {
  return (
    <Card>
      <CardContent className="py-12 text-center text-muted-foreground space-y-2">
        <CalendarDays className="h-10 w-10 mx-auto opacity-50" />
        <p>School calendar coming soon.</p>
      </CardContent>
    </Card>
  );
}