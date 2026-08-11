import CalendarClient from "@/components/CalendarClient";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const now = new Date();
  const initialMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  return (
    <div className="space-y-6">
      <CalendarClient initialMonth={initialMonth} />
    </div>
  );
}
