"use client";

import { useEffect, useMemo, useState } from "react";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import DroppableSection from "@/components/form-builder/DroppableSection";
import FieldEditorDialog from "@/components/form-builder/FieldEditorDialog";
import FieldPalette from "@/components/form-builder/FieldPalette";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  BuilderData,
  FieldType,
  ServiceFormField,
} from "@/types/application-workflow";

import {
  useCreateServiceFormCondition,
  useCreateServiceFormField,
  useCreateServiceFormSection,
  useCreateServiceFormStep,
  useDeleteServiceFormCondition,
  useDeleteServiceFormField,
  useUpdateServiceFormField,
} from "@/hooks/application-workflow/use-application-workflow";

type Props = {
  serviceFormId: number;
  data: BuilderData;
};

function makeName(type: string, count: number) {
  return `${type}_${count + 1}`
    .replace(/[^a-z0-9_]/gi, "_")
    .toLowerCase();
}

function sectionIdOf(field: ServiceFormField) {
  return field.section_id ?? field.service_form_section_id ?? 0;
}

export default function FormBuilderCanvas({
  serviceFormId,
  data,
}: Props) {
  const [selectedField, setSelectedField] =
    useState<ServiceFormField | null>(null);

  const [localFields, setLocalFields] =
    useState<ServiceFormField[]>(data.fields);

  const [stepTitle, setStepTitle] = useState("");
  const [sectionTitle, setSectionTitle] = useState("");

  useEffect(() => {
    setLocalFields(data.fields);
  }, [data.fields]);

  const createStep = useCreateServiceFormStep(serviceFormId);
  const createSection = useCreateServiceFormSection(serviceFormId);
  const createField = useCreateServiceFormField(serviceFormId);
  const updateField = useUpdateServiceFormField(serviceFormId);
  const deleteField = useDeleteServiceFormField(serviceFormId);

  const createCondition =
    useCreateServiceFormCondition(serviceFormId);

  const deleteCondition =
    useDeleteServiceFormCondition(serviceFormId);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  const fieldsBySection = useMemo(() => {
    const grouped: Record<number, ServiceFormField[]> = {};

    data.sections.forEach((section) => {
      grouped[section.id] = [];
    });

    localFields.forEach((field) => {
      const key = sectionIdOf(field);
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(field);
    });

    Object.keys(grouped).forEach((key) => {
      grouped[Number(key)].sort(
        (a, b) =>
          Number(a.sort_order || 0) -
          Number(b.sort_order || 0)
      );
    });

    return grouped;
  }, [data.sections, localFields]);

  async function addStep() {
    if (!stepTitle.trim()) return;

    await createStep.mutateAsync({
      title: stepTitle.trim(),
      step_order: data.steps.length + 1,
      sort_order: data.steps.length + 1,
      is_active: true,
    });

    setStepTitle("");
    toast.success("Step created");
  }

  async function addSection() {
    if (!sectionTitle.trim()) return;

    await createSection.mutateAsync({
      title: sectionTitle.trim(),
      sort_order: data.sections.length + 1,
      is_active: true,
    });

    setSectionTitle("");
    toast.success("Section created");
  }

  async function createDroppedField(
    type: FieldType,
    sectionId: number
  ) {
    const sectionFields =
      fieldsBySection[sectionId] ?? [];

    const order = sectionFields.length + 1;

    const name = makeName(
      type,
      localFields.length
    );

    await createField.mutateAsync({
      service_form_section_id: sectionId,
      section_id: sectionId,
      label: `${type
        .toString()
        .toUpperCase()} Field`,
      name,
      type,
      placeholder: "",
      options: ["select", "radio"].includes(
        type
      )
        ? ["Option 1", "Option 2"]
        : [],
      validation_rules: "",
      is_required: false,
      is_active: true,
      sort_order: order,
      width: "full",
    });

    toast.success("Field added");
  }

  async function reorderFields(
    activeId: number,
    overId: number
  ) {
    const oldIndex = localFields.findIndex(
      (field) => field.id === activeId
    );

    const newIndex = localFields.findIndex(
      (field) => field.id === overId
    );

    if (oldIndex < 0 || newIndex < 0) return;

    const next = arrayMove(
      localFields,
      oldIndex,
      newIndex
    ).map((field, index) => ({
      ...field,
      sort_order: index + 1,
    }));

    setLocalFields(next);

    await Promise.all(
      next.map((field) =>
        updateField.mutateAsync({
          id: field.id,
          payload: {
            sort_order: field.sort_order,
            service_form_section_id:
              field.service_form_section_id ??
              field.section_id ??
              null,
            section_id:
              field.section_id ??
              field.service_form_section_id ??
              null,
          },
        })
      )
    );
  }

  async function moveFieldToSection(
    fieldId: number,
    sectionId: number
  ) {
    const next = localFields.map((field) =>
      field.id === fieldId
        ? {
            ...field,
            service_form_section_id: sectionId,
            section_id: sectionId,
          }
        : field
    );

    setLocalFields(next);

    await updateField.mutateAsync({
      id: fieldId,
      payload: {
        service_form_section_id: sectionId,
        section_id: sectionId,
      },
    });
  }

  async function handleDragEnd(
    event: DragEndEvent
  ) {
    const activeId = String(
      event.active.id
    );

    const overId = event.over
      ? String(event.over.id)
      : "";

    if (!overId) return;

    if (
      activeId.startsWith("palette:") &&
      overId.startsWith("section:")
    ) {
      await createDroppedField(
        activeId.replace(
          "palette:",
          ""
        ) as FieldType,
        Number(
          overId.replace(
            "section:",
            ""
          )
        )
      );
      return;
    }

    if (
      !activeId.startsWith("palette:") &&
      overId.startsWith("section:")
    ) {
      await moveFieldToSection(
        Number(activeId),
        Number(
          overId.replace(
            "section:",
            ""
          )
        )
      );
      return;
    }

    if (
      !activeId.startsWith("palette:") &&
      !overId.startsWith("section:")
    ) {
      await reorderFields(
        Number(activeId),
        Number(overId)
      );
    }
  }

  async function handleSaveField(
    id: number,
    payload: Partial<ServiceFormField>
  ) {
    await updateField.mutateAsync({
      id,
      payload,
    });

    toast.success("Field updated");
  }

  async function handleDeleteField(id: number) {
    await deleteField.mutateAsync(id);

    setLocalFields((current) =>
      current.filter(
        (field) => field.id !== id
      )
    );

    toast.success("Field deleted");
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* LEFT PANEL */}
        <div className="space-y-4">
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle className="text-base">
                Field Palette
              </CardTitle>
            </CardHeader>

            <CardContent>
              {/* ✅ FIXED HERE */}
              <FieldPalette
                onAdd={async (type) => {
                  if (!data.sections.length) {
                    toast.error(
                      "Create a section first"
                    );
                    return;
                  }

                  const firstSection =
                    data.sections[0];

                  await createDroppedField(
                    type,
                    firstSection.id
                  );
                }}
              />

              <p className="mt-3 text-xs text-muted-foreground">
                Drag a field into any
                section.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle className="text-base">
                Quick Create
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Step title"
                  value={stepTitle}
                  onChange={(e) =>
                    setStepTitle(
                      e.target.value
                    )
                  }
                />
                <Button size="icon" onClick={addStep}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Section title"
                  value={sectionTitle}
                  onChange={(e) =>
                    setSectionTitle(
                      e.target.value
                    )
                  }
                />
                <Button
                  size="icon"
                  onClick={addSection}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT PANEL */}
        <div className="space-y-6">
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle>
                {data.form?.title ||
                  "Form Builder"}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {data.form?.description}
              </p>
            </CardHeader>
          </Card>

          {data.sections.length > 0 ? (
            data.sections.map((section) => (
              <DroppableSection
                key={section.id}
                section={section}
                fields={
                  fieldsBySection[
                    section.id
                  ] ?? []
                }
                onEditField={setSelectedField}
                onDeleteField={
                  handleDeleteField
                }
              />
            ))
          ) : (
            <div className="rounded-3xl border border-dashed p-10 text-center text-muted-foreground">
              Create a section first,
              then drag fields into it.
            </div>
          )}
        </div>
      </div>

      <FieldEditorDialog
        open={Boolean(selectedField)}
        field={selectedField}
        fields={data.fields}
        sections={data.sections}
        conditions={data.conditions}
        onOpenChange={(open) =>
          !open && setSelectedField(null)
        }
        onSave={handleSaveField}
        onCreateCondition={async (
          payload
        ) => {
          await createCondition.mutateAsync(
            payload
          );
          toast.success("Condition added");
        }}
        onDeleteCondition={async (
          id
        ) => {
          await deleteCondition.mutateAsync(
            id
          );
          toast.success(
            "Condition deleted"
          );
        }}
        loading={updateField.isPending}
      />
    </DndContext>
  );
}