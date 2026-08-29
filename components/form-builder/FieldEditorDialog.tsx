"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  ServiceFormField,
  ServiceFormFieldCondition,
  ServiceFormSection,
} from "@/types/application-workflow";

type Props = {
  open: boolean;
  field: ServiceFormField | null;
  fields: ServiceFormField[];
  sections: ServiceFormSection[];
  conditions: ServiceFormFieldCondition[];
  onOpenChange: (open: boolean) => void;
  onSave: (id: number, payload: Partial<ServiceFormField>) => Promise<void>;
  onCreateCondition: (payload: Partial<ServiceFormFieldCondition>) => Promise<void>;
  onDeleteCondition: (id: number) => Promise<void>;
  loading?: boolean;
};

export default function FieldEditorDialog({
  open,
  field,
  fields,
  sections,
  conditions,
  onOpenChange,
  onSave,
  onCreateCondition,
  onDeleteCondition,
  loading,
}: Props) {
  const [form, setForm] = useState<Partial<ServiceFormField>>({});
  const [condition, setCondition] = useState({
    depends_on_field_id: "",
    operator: "equals",
    expected_value: "",
    action: "show",
  });

  useEffect(() => {
    if (field) {
      setForm({
        label: field.label,
        name: field.name,
        type: field.type,
        placeholder: field.placeholder || "",
        help_text: field.help_text || "",
        default_value: field.default_value || "",
        options: Array.isArray(field.options) ? field.options : [],
        validation_rules: field.validation_rules || "",
        is_required: Boolean(field.is_required),
        is_active: field.is_active !== false,
        width: field.width || "full",
        service_form_section_id: field.service_form_section_id ?? field.section_id ?? null,
        section_id: field.section_id ?? field.service_form_section_id ?? null,
        sort_order: field.sort_order,
      });
    }
  }, [field]);

  const fieldConditions = useMemo(
    () => conditions.filter((item) => item.field_id === field?.id),
    [conditions, field?.id]
  );

  if (!field) return null;

  async function handleSave() {
    await onSave(field.id, {
      ...form,
      options:
        typeof form.options === "string"
          ? String(form.options)
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean)
          : form.options,
      service_form_section_id: Number(form.service_form_section_id || form.section_id || 0) || null,
      section_id: Number(form.section_id || form.service_form_section_id || 0) || null,
      sort_order: Number(form.sort_order || 1),
    });

    onOpenChange(false);
  }

  async function handleCreateCondition() {
    if (!condition.depends_on_field_id || !condition.expected_value) return;

    await onCreateCondition({
      field_id: field.id,
      depends_on_field_id: Number(condition.depends_on_field_id),
      operator: condition.operator,
      expected_value: condition.expected_value,
      action: condition.action,
    });

    setCondition({
      depends_on_field_id: "",
      operator: "equals",
      expected_value: "",
      action: "show",
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Field</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Label</Label>
            <Input value={form.label || ""} onChange={(event) => setForm({ ...form, label: event.target.value })} />
          </div>

          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={form.name || ""} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </div>

          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={String(form.type || "text")} onValueChange={(value) => setForm({ ...form, type: value as any })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["text", "textarea", "number", "email", "tel", "date", "select", "radio", "checkbox", "file", "image"].map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Section</Label>
            <Select
              value={String(form.service_form_section_id || form.section_id || "")}
              onValueChange={(value) =>
                setForm({
                  ...form,
                  service_form_section_id: Number(value),
                  section_id: Number(value),
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select section" />
              </SelectTrigger>
              <SelectContent>
                {sections.map((section) => (
                  <SelectItem key={section.id} value={String(section.id)}>
                    {section.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Placeholder</Label>
            <Input value={form.placeholder || ""} onChange={(event) => setForm({ ...form, placeholder: event.target.value })} />
          </div>

          <div className="space-y-2">
            <Label>Width</Label>
            <Select value={String(form.width || "full")} onValueChange={(value) => setForm({ ...form, width: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">Full</SelectItem>
                <SelectItem value="half">Half</SelectItem>
                <SelectItem value="third">Third</SelectItem>
                <SelectItem value="quarter">Quarter</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Options comma separated</Label>
            <Input
              value={Array.isArray(form.options) ? form.options.join(", ") : String(form.options || "")}
              onChange={(event) => setForm({ ...form, options: event.target.value as any })}
              placeholder="Yes, No, Other"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={Boolean(form.is_required)}
              onChange={(event) => setForm({ ...form, is_required: event.target.checked })}
            />
            <Label>Required</Label>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={form.is_active !== false}
              onChange={(event) => setForm({ ...form, is_active: event.target.checked })}
            />
            <Label>Active</Label>
          </div>
        </div>

        <div className="rounded-2xl border p-4">
          <h3 className="mb-3 font-semibold">Conditions</h3>

          <div className="grid gap-3 md:grid-cols-4">
            <Select
              value={condition.depends_on_field_id}
              onValueChange={(value) => setCondition({ ...condition, depends_on_field_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Depends on" />
              </SelectTrigger>
              <SelectContent>
                {fields
                  .filter((item) => item.id !== field.id)
                  .map((item) => (
                    <SelectItem key={item.id} value={String(item.id)}>
                      {item.label}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            <Select value={condition.operator} onValueChange={(value) => setCondition({ ...condition, operator: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="equals">Equals</SelectItem>
                <SelectItem value="not_equals">Not equals</SelectItem>
                <SelectItem value="contains">Contains</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Expected value"
              value={condition.expected_value}
              onChange={(event) => setCondition({ ...condition, expected_value: event.target.value })}
            />

            <Button type="button" onClick={handleCreateCondition}>
              Add
            </Button>
          </div>

          <div className="mt-4 space-y-2">
            {fieldConditions.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-xl bg-muted px-3 py-2 text-sm">
                <span>
                  {item.action || "show"} when field #{item.depends_on_field_id} {item.operator} {item.expected_value}
                </span>
                <Button type="button" variant="ghost" size="sm" onClick={() => onDeleteCondition(item.id)}>
                  Delete
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            Save Field
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
