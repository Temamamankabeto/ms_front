"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";

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

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import SectionForm from "@/components/service-form-sections/SectionForm";

import {
  useCreateServiceFormSection,
  useUpdateServiceFormSection,
  useServiceFormSections,
} from "@/hooks/service-form-section/use-service-form-section";

import {
  ServiceFormSection,
  ServiceFormSectionPayload,
} from "@/types/service-form-section";

export default function ServiceFormSectionsPage() {
  const [open, setOpen] = useState(false);

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [formData, setFormData] =
    useState<ServiceFormSectionPayload>({
      service_form_id: 0,
      title: "",
      description: "",
      sort_order: 0,
      is_active: true,
    });

  const {
    data: sections = [],
    isLoading,
  } = useServiceFormSections();

  const createMutation =
    useCreateServiceFormSection();

  const updateMutation =
    useUpdateServiceFormSection();

  function resetForm() {
    setEditingId(null);

    setFormData({
      service_form_id: 0,
      title: "",
      description: "",
      sort_order: 0,
      is_active: true,
    });
  }

  function openCreate() {
    resetForm();
    setOpen(true);
  }

  function handleEdit(
    section: ServiceFormSection
  ) {
    setEditingId(section.id);

    setFormData({
      service_form_id:
        section.service_form_id,
      title: section.title,
      description:
        section.description || "",
      sort_order:
        section.sort_order || 0,
      is_active:
        section.is_active ?? true,
    });

    setOpen(true);
  }

  async function handleSave() {
    const payload = {
      ...formData,
      service_form_id: Number(
        formData.service_form_id
      ),
      sort_order: Number(
        formData.sort_order
      ),
    };

    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          payload,
        });
      } else {
        await createMutation.mutateAsync(
          payload
        );
      }

      setOpen(false);
      resetForm();
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Service Form Sections
          </h1>

          <p className="text-sm text-muted-foreground">
            Manage form sections
          </p>
        </div>

        <Button onClick={openCreate}>
          Create Section
        </Button>
      </div>

      <Dialog
        open={open}
        onOpenChange={(value) => {
          setOpen(value);

          if (!value) {
            resetForm();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId
                ? "Edit Section"
                : "Create Section"}
            </DialogTitle>
          </DialogHeader>

          <SectionForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleSave}
            loading={
              createMutation.isPending ||
              updateMutation.isPending
            }
          />
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>
            Sections List
          </CardTitle>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>

                <TableHead>
                  Service Form
                </TableHead>

                <TableHead>
                  Title
                </TableHead>

                <TableHead>
                  Description
                </TableHead>

                <TableHead>
                  Sort Order
                </TableHead>

                <TableHead>
                  Status
                </TableHead>

                <TableHead className="text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center"
                  >
                    Loading...
                  </TableCell>
                </TableRow>
              ) : sections.length > 0 ? (
                sections.map(
                  (
                    section: ServiceFormSection
                  ) => (
                    <TableRow
                      key={section.id}
                    >
                      <TableCell>
                        {section.id}
                      </TableCell>

                      <TableCell>
                        {section.form
                          ?.title ||
                          section.service_form_id}
                      </TableCell>

                      <TableCell>
                        {section.title}
                      </TableCell>

                      <TableCell>
                        {section.description ||
                          "-"}
                      </TableCell>

                      <TableCell>
                        {section.sort_order}
                      </TableCell>

                      <TableCell>
                        {section.is_active
                          ? "Active"
                          : "Inactive"}
                      </TableCell>

                      <TableCell className="text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() =>
                            handleEdit(
                              section
                            )
                          }
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                )
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center"
                  >
                    No sections found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}