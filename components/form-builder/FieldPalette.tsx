"use client";

import { Button } from "@/components/ui/button";
import { ServiceFormFieldType } from "@/types/services/service";

type FieldPaletteProps = {
  onAdd: (type: ServiceFormFieldType) => void | Promise<void>;
};

const fieldTypes: {
  type: ServiceFormFieldType;
  label: string;
}[] = [
  { type: "text", label: "Text" },
  { type: "textarea", label: "Textarea" },
  { type: "number", label: "Number" },
  { type: "email", label: "Email" },
  { type: "tel", label: "Phone" },
  { type: "date", label: "Date" },
  { type: "select", label: "Select" },
  { type: "radio", label: "Radio" },
  { type: "checkbox", label: "Checkbox" },
  { type: "file", label: "File" },
  { type: "image", label: "Image" },
];

export default function FieldPalette({
  onAdd,
}: FieldPaletteProps) {
  return (
    <div className="space-y-3">
      <h2 className="font-bold">Fields</h2>

      <div className="grid gap-2">
        {fieldTypes.map((field) => (
          <Button
            key={field.type}
            type="button"
            variant="outline"
            className="justify-start rounded-2xl"
            onClick={() => onAdd(field.type)}
          >
            {field.label}
          </Button>
        ))}
      </div>
    </div>
  );
}