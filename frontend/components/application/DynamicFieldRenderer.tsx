"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { ServiceFormField } from "@/types/application-workflow";

interface Props {
  field: ServiceFormField;
  value: any;
  values?: Record<string, any>;
  onChange: (name: string, value: any) => void;
}

function normalizeOptions(options?: string[] | string | null) {
  if (!options) return [];

  if (Array.isArray(options)) return options;

  try {
    const parsed = JSON.parse(options);

    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {
    // fallback below
  }

  return String(options)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function conditionMatches(operator: string, actual: any, expected: string) {
  const current = actual === undefined || actual === null ? "" : String(actual);

  switch (operator) {
    case "not_equals":
      return current !== expected;
    case "contains":
      return current.includes(expected);
    case "greater_than":
      return Number(current) > Number(expected);
    case "less_than":
      return Number(current) < Number(expected);
    case "equals":
    default:
      return current === expected;
  }
}

export default function DynamicFieldRenderer({ field, value, values = {}, onChange }: Props) {
  const hiddenByCondition = field.conditions?.some((condition) => {
    const dependsOnValue = values[String(condition.depends_on_field_id)] ?? values[condition.depends_on_field?.name ?? ""];
    const matches = conditionMatches(condition.operator, dependsOnValue, condition.expected_value);

    return condition.action === "hide" ? matches : condition.action === "show" ? !matches : false;
  });

  if (hiddenByCondition || field.is_active === false) return null;

  const label = (
    <Label>
      {field.label}
      {field.is_required && <span className="ml-1 text-red-500">*</span>}
    </Label>
  );

  const commonProps = {
    required: Boolean(field.is_required),
    placeholder: field.placeholder || "",
  };

  switch (field.type) {
    case "textarea":
      return (
        <div className="space-y-2">
          {label}
          <textarea
            className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={value || ""}
            {...commonProps}
            onChange={(event) => onChange(field.name, event.target.value)}
          />
          {field.help_text && <p className="text-xs text-muted-foreground">{field.help_text}</p>}
        </div>
      );

    case "select":
    case "radio": {
      const options = normalizeOptions(field.options);

      return (
        <div className="space-y-2">
          {label}
          <Select value={value || ""} onValueChange={(next) => onChange(field.name, next)}>
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder || "Select option"} />
            </SelectTrigger>

            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {field.help_text && <p className="text-xs text-muted-foreground">{field.help_text}</p>}
        </div>
      );
    }

    case "checkbox":
      return (
        <label className="flex items-center gap-3 rounded-2xl border p-4">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(event) => onChange(field.name, event.target.checked)}
          />
          <span>
            <span className="block text-sm font-medium">
              {field.label}
              {field.is_required && <span className="ml-1 text-red-500">*</span>}
            </span>
            {field.help_text && <span className="text-xs text-muted-foreground">{field.help_text}</span>}
          </span>
        </label>
      );

    case "file":
    case "image":
      return (
        <div className="space-y-2">
          {label}
          <Input
            type="file"
            required={Boolean(field.is_required)}
            accept={field.type === "image" ? "image/*" : undefined}
            onChange={(event) => onChange(field.name, event.target.files?.[0] || null)}
          />
          {field.help_text && <p className="text-xs text-muted-foreground">{field.help_text}</p>}
        </div>
      );

    default:
      return (
        <div className="space-y-2">
          {label}
          <Input
            type={field.type}
            value={value || ""}
            {...commonProps}
            onChange={(event) => onChange(field.name, event.target.value)}
          />
          {field.help_text && <p className="text-xs text-muted-foreground">{field.help_text}</p>}
        </div>
      );
  }
}
