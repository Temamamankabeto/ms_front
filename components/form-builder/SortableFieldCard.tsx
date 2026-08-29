"use client";

import { Input } from "@/components/ui/input";

import { Button } from "@/components/ui/button";

interface Props {
  field: any;
  onDelete: () => void;
  onChange: (
    key: string,
    value: any
  ) => void;
}

export default function SortableFieldCard({
  field,
  onDelete,
  onChange,
}: Props) {

  return (
    <div className="rounded-3xl border bg-card p-5 shadow-sm">

      <div className="space-y-4">

        <Input
          value={field.label}
          placeholder="Field Label"
          onChange={(e) =>
            onChange(
              "label",
              e.target.value
            )
          }
        />

        <Input
          value={field.name}
          placeholder="Field Name"
          onChange={(e) =>
            onChange(
              "name",
              e.target.value
            )
          }
        />

        <div className="flex items-center justify-between">

          <span className="text-sm text-muted-foreground capitalize">
            {field.type}
          </span>

          <Button
            size="sm"
            variant="destructive"
            onClick={onDelete}
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}