"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";
import { Card } from "@/components/ui/card";

type Item = {
  id: string;
  title: string;
  type: "service" | "window";
};

function SortableCard({ item }: { item: Item }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        p-4 rounded-2xl border shadow-sm cursor-grab active:cursor-grabbing
        transition-all duration-200
        hover:shadow-lg hover:-translate-y-1
        bg-white
        ${isDragging ? "opacity-50 scale-105" : ""}
      `}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-sm">{item.title}</p>
          <p className="text-xs text-muted-foreground">
            {item.type.toUpperCase()}
          </p>
        </div>

        {/* drag handle feel */}
        <div className="text-gray-400 text-lg">⋮⋮</div>
      </div>
    </Card>
  );
}

export default function DragBoard() {
  const [items, setItems] = useState<Item[]>([
    { id: "1", title: "Construction Permit", type: "service" },
    { id: "2", title: "Business License", type: "service" },
    { id: "3", title: "Window A", type: "window" },
    { id: "4", title: "Window B", type: "window" },
  ]);

  const sensors = useSensors(useSensor(PointerSensor));

  return (
    <div className="w-full p-6">
      {/* BOARD */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={(event) => {
            const { active, over } = event;
            if (!over || active.id === over.id) return;

            setItems((prev) => {
              const oldIndex = prev.findIndex((i) => i.id === active.id);
              const newIndex = prev.findIndex((i) => i.id === over.id);
              return arrayMove(prev, oldIndex, newIndex);
            });
          }}
        >
          <SortableContext
            items={items}
            strategy={verticalListSortingStrategy}
          >
            {items.map((item) => (
              <SortableCard key={item.id} item={item} />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}