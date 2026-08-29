"use client";

import { useEffect, useState } from "react";

import {
  DndContext,
  closestCenter,
} from "@dnd-kit/core";

import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import {
  Button,
} from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import FieldForm from "@/components/service-form-fields/FieldForm";
import SortableFieldCard from "@/components/service-form-fields/SortableFieldCard";

import api from "@/lib/api";

import {
  useCreateServiceFormField,
  useServiceFormFields,
} from "@/hooks/service-form-field/use-service-form-field";

export default function ServiceFormFieldsPage() {
  const [open, setOpen] = useState(false);

  const [formData, setFormData] = useState({
    service_form_id: 0,
    service_form_section_id: 0,
    label: "",
    name: "",
    type: "",
    is_required: false,
    is_active: true,
    sort_order: 0,
  });

  const {
    data: fields = [],
    isLoading,
    refetch,
  } = useServiceFormFields();

  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    setItems(fields);
  }, [fields]);

  const createMutation = useCreateServiceFormField();

  async function handleCreate() {
    await createMutation.mutateAsync({
      ...formData,
      service_form_id: Number(formData.service_form_id),
      service_form_section_id: Number(formData.service_form_section_id),
    });

    await refetch();

    setOpen(false);
  }

  async function handleDragEnd(event: any) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = items.findIndex(
      (item: any) => item.id === active.id
    );

    const newIndex = items.findIndex(
      (item: any) => item.id === over.id
    );

    const reorderedItems = arrayMove(
      items,
      oldIndex,
      newIndex
    );

    setItems(reorderedItems);

    await api.patch(
      "/service-form-fields/reorder",
      {
        fields: reorderedItems.map(
          (
            item: any,
            index: number
          ) => ({
            id: item.id,
            sort_order: index + 1,
          })
        ),
      }
    );

    await refetch();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Service Form Fields
          </h1>

          <p className="text-sm text-muted-foreground">
            Manage dynamic form fields
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              Create Field
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Create Field
              </DialogTitle>
            </DialogHeader>

            <FieldForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleCreate}
              loading={createMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Drag & Drop Fields
          </CardTitle>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <p>Loading...</p>
          ) : (
            <DndContext
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={items.map((item: any) => item.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {items.map((field: any) => (
                    <SortableFieldCard
                      key={field.id}
                      field={field}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
