"use client";

import { useParams } from "next/navigation";

import { useState } from "react";

import FieldPalette from "@/components/form-builder/FieldPalette";

import SortableFieldCard from "@/components/form-builder/SortableFieldCard";

import {
  Card,
  CardContent,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import {

  useServiceFormFieldMutations,
  useServiceForms,

} from "@/hooks/services/use-service";

import {

  CreateServiceFormFieldPayload,
  ServiceForm,
  ServiceFormField,
  ServiceFormFieldType,

} from "@/types/services/service";

export default function FormBuilderPage() {

  /*
  |--------------------------------------------------------------------------
  | PARAMS
  |--------------------------------------------------------------------------
  */

  const params = useParams();

  const serviceFormId =
    Number(params.id);

  /*
  |--------------------------------------------------------------------------
  | QUERIES
  |--------------------------------------------------------------------------
  */

  const {
    data: formsData,
  } = useServiceForms();

  /*
  |--------------------------------------------------------------------------
  | MUTATIONS
  |--------------------------------------------------------------------------
  */

  const {
    create,
    update,
    remove,
  } = useServiceFormFieldMutations();

  /*
  |--------------------------------------------------------------------------
  | FORM
  |--------------------------------------------------------------------------
  */

  const forms: ServiceForm[] =
    formsData?.data?.data || [];

  const currentForm =
    forms.find(
      (form) =>
        form.id === serviceFormId
    );

  /*
  |--------------------------------------------------------------------------
  | STATE
  |--------------------------------------------------------------------------
  */

  const [fields, setFields] =
    useState<ServiceFormField[]>(
      []
    );

  /*
  |--------------------------------------------------------------------------
  | ADD FIELD
  |--------------------------------------------------------------------------
  */

  async function addField(
    type: ServiceFormFieldType
  ) {

    try {

      const payload:
        CreateServiceFormFieldPayload = {

        service_form_id:
          serviceFormId,

        label: "New Field",

        name:
          `field_${Date.now()}`,

        type,

        placeholder: "",

        validation_rules: "",

        is_required: false,

        sort_order:
          fields.length + 1,

        width: "half",
      };

      const response =
  await create.mutateAsync(payload);

const createdField =
  (response as any)?.data?.data ??
  (response as any)?.data ??
  response;

setFields((prev) => [
  ...prev,
  createdField as ServiceFormField,
]);

    } catch (error) {

      console.error(error);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | DELETE FIELD
  |--------------------------------------------------------------------------
  */

  async function deleteField(
    id: number
  ) {

    try {

      await remove.mutateAsync(id);

      setFields(
        fields.filter(
          (field) =>
            field.id !== id
        )
      );

    } catch (error) {

      console.error(error);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | UPDATE FIELD
  |--------------------------------------------------------------------------
  */

  async function updateField(
    id: number,
    key: keyof ServiceFormField,
    value: unknown
  ) {

    try {

      const field =
        fields.find(
          (item) =>
            item.id === id
        );

      if (!field) return;

      const updatedField = {

        ...field,

        [key]: value,
      };

      setFields(
        fields.map((item) =>
          item.id === id
            ? updatedField
            : item
        )
      );

      await update.mutateAsync({

        id,

        payload: {
          [key]: value,
        },
      });

    } catch (error) {

      console.error(error);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | SAVE ORDER
  |--------------------------------------------------------------------------
  */

  async function saveOrder() {

    try {

      await Promise.all(

        fields.map(
          async (
            field,
            index
          ) => {

            await update.mutateAsync({

              id: field.id,

              payload: {

                sort_order:
                  index + 1,
              },
            });
          }
        )
      );

    } catch (error) {

      console.error(error);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <div className="space-y-6">

      {/* HEADER */}

      <div className="flex items-center justify-between">

        <div>

          <h1 className="text-3xl font-black">
            Form Builder
          </h1>

          <p className="text-muted-foreground">

            {currentForm?.title ||
              "Dynamic Service Form"}

          </p>

        </div>

        <Button
          onClick={saveOrder}
          className="rounded-2xl"
        >
          Save Order
        </Button>

      </div>

      {/* BODY */}

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">

        {/* LEFT PANEL */}

        <Card className="rounded-3xl">

          <CardContent className="p-5">

            <FieldPalette
              onAdd={addField}
            />

          </CardContent>

        </Card>

        {/* RIGHT PANEL */}

        <div className="space-y-4">

          {fields.length === 0 ? (

            <Card className="rounded-3xl">

              <CardContent className="flex h-40 items-center justify-center text-sm text-muted-foreground">

                No fields added yet.

              </CardContent>

            </Card>

          ) : (

            fields.map((field) => (

              <SortableFieldCard

                key={field.id}

                field={field}

                onDelete={() =>
                  deleteField(
                    field.id
                  )
                }

                onChange={(
                  key,
                  value
                ) =>
                  updateField(
                    field.id,
                    key as keyof ServiceFormField,
                    value
                  )
                }
              />

            ))

          )}

          {/* SAVE */}

          <Button
            onClick={saveOrder}
            className="rounded-2xl"
          >
            Save Form
          </Button>

        </div>

      </div>

    </div>
  );
}