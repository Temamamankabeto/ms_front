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
        <div className="flex min-w-0 items-center gap-3">
          <img
            src="/mesob-kiosk-logo.png"
            alt=""
            aria-hidden="true"
            className="h-11 w-11 shrink-0 object-contain"
          />
          <div className="min-w-0">
            <p className="font-semibold">{service.name}</p>
            <p className="text-sm text-muted-foreground">{service.status}</p>
          </div>
        </div>

        <Badge>
          {service.has_back_officer ? "Front + Back" : "Front Only"}
        </Badge>
      </div>
    </button>
  );
}
