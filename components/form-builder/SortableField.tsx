"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ServiceFormField } from "@/types/application-workflow";
import { cn } from "@/lib/utils";

type Props = {
  field: ServiceFormField;
  onEdit: (field: ServiceFormField) => void;
  onDelete: (id: number) => void;
};

export default function SortableField({ field, onEdit, onDelete }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: String(field.id),
    data: { kind: "field", field },
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn("rounded-2xl border bg-background p-4 shadow-sm", isDragging && "opacity-60")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <button type="button" {...attributes} {...listeners} className="mt-1 cursor-grab text-muted-foreground">
            <GripVertical className="h-4 w-4" />
          </button>

          <div className="min-w-0">
            <p className="truncate font-medium">
              {field.label}
              {field.is_required && <span className="ml-1 text-red-500">*</span>}
            </p>
            <p className="text-xs text-muted-foreground">
              {field.name} · {field.type} · order {field.sort_order}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 gap-1">
          <Button variant="ghost" size="icon" onClick={() => onEdit(field)}>
            <Pencil className="h-4 w-4" />
          </Button>

          <Button variant="ghost" size="icon" onClick={() => onDelete(field.id)}>
            <Trash2 className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      </div>
    </div>
  );
}
