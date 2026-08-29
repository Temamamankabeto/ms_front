import { Badge } from "@/components/ui/badge";

export default function ServiceCard(props: any) {
  const { service, selected, onSelect } = props;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-xl border p-4 text-left transition ${selected ? "border-primary bg-primary/5" : "hover:bg-muted"}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold">{service.name}</p>
          <p className="text-sm text-muted-foreground">{service.status}</p>
        </div>

        <Badge>
          {service.has_back_officer ? "Front + Back" : "Front Only"}
        </Badge>
      </div>
    </button>
  );
}
