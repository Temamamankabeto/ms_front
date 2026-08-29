"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

import {
  Card,
  CardContent,
} from "@/components/ui/card";

export default function SortableFieldCard({ field }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: field.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card>
        <CardContent className="flex items-center justify-between p-4">
          <div>
            <p className="font-semibold">{field.label}</p>
            <p className="text-sm text-muted-foreground">{field.type}</p>
          </div>

          <button
            {...attributes}
            {...listeners}
            className="cursor-grab"
          >
            <GripVertical className="h-5 w-5" />
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
