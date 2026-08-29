"use client";

export default function ConditionalFieldRenderer({
  field,
  values,
  children,
}: any) {

  if (!field?.conditions) {
    return children;
  }

  const condition =
    field.conditions;

  const targetValue =
    values?.[
      condition.field
    ];

  const shouldShow =
    targetValue ===
    condition.equals;

  if (!shouldShow) {
    return null;
  }

  return children;
}
