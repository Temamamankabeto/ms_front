import { Badge } from "@/components/ui/badge";

export default function OfficerCard({
  user,
  isAssigned,
  isSelected,
  onSelect,
}: any) {
  if (isAssigned) {
    return (
      <div className="pointer-events-none w-full rounded-xl border-2 border-green-500 bg-green-50 p-4 text-left opacity-50">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.role}</p>
          </div>

          <Badge className="bg-green-600 hover:bg-green-600">
            Currently Assigned
          </Badge>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-xl border p-4 text-left transition ${
        isSelected
          ? "border-primary bg-primary/5"
          : "hover:bg-muted"
      }`}
    >
      <p className="font-semibold">{user.name}</p>
      <p className="text-sm text-muted-foreground">{user.role}</p>
    </button>
  );
}
