"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

import SortableField from "@/components/form-builder/SortableField";
import { ServiceFormField, ServiceFormSection } from "@/types/application-workflow";
import { cn } from "@/lib/utils";

type Props = {
  section: ServiceFormSection;
  fields: ServiceFormField[];
  onEditField: (field: ServiceFormField) => void;
  onDeleteField: (id: number) => void;
};

export default function DroppableSection({ section, fields, onEditField, onDeleteField }: Props) {
  const { setNodeRef, isOver } = useDroppable({
    id: `section:${section.id}`,
    data: { kind: "section", section },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-3xl border bg-muted/20 p-4 transition",
        isOver && "border-primary bg-primary/5"
      )}
    >
      <div className="mb-4">
        <h3 className="font-semibold">{section.title}</h3>
        {section.description && <p className="text-sm text-muted-foreground">{section.description}</p>}
      </div>

      <SortableContext items={fields.map((field) => String(field.id))} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {fields.map((field) => (
            <SortableField key={field.id} field={field} onEdit={onEditField} onDelete={onDeleteField} />
          ))}

          {!fields.length && (
            <div className="rounded-2xl border border-dashed bg-background p-8 text-center text-sm text-muted-foreground">
              Drop fields here
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}
