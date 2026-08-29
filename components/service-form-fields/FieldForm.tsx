"use client";

import { useQuery } from "@tanstack/react-query";

import api from "@/lib/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function FieldForm({
  formData,
  setFormData,
  onSubmit,
  loading,
}: any) {
  const { data: forms = [] } = useQuery({
    queryKey: ["service-forms"],

    queryFn: async () => {
      const response = await api.get(
        "/service-forms"
      );

      return Array.isArray(response?.data?.data)
        ? response.data.data
        : [];
    },
  });

  const { data: sections = [] } = useQuery({
    queryKey: [
      "service-form-sections",
    ],

    queryFn: async () => {
      const response = await api.get(
        "/service-form-sections"
      );

      return Array.isArray(response?.data?.data)
        ? response.data.data
        : [];
    },
  });

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Service Form</Label>

        <select
          value={formData.service_form_id}
          onChange={(e) =>
            setFormData({
              ...formData,
              service_form_id:
                e.target.value,
            })
          }
          className="w-full rounded-md border px-3 py-2"
        >
          <option value="">
            Select Form
          </option>

          {forms.map((form: any) => (
            <option
              key={form.id}
              value={form.id}
            >
              {form.title}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label>Section</Label>

        <select
          value={
            formData.service_form_section_id
          }
          onChange={(e) =>
            setFormData({
              ...formData,
              service_form_section_id:
                e.target.value,
            })
          }
          className="w-full rounded-md border px-3 py-2"
        >
          <option value="">
            Select Section
          </option>

          {sections.map(
            (section: any) => (
              <option
                key={section.id}
                value={section.id}
              >
                {section.title}
              </option>
            )
          )}
        </select>
      </div>

      <div className="space-y-2">
        <Label>Label</Label>

        <Input
          value={formData.label}
          onChange={(e) =>
            setFormData({
              ...formData,
              label: e.target.value,
            })
          }
        />
      </div>

      <div className="space-y-2">
        <Label>Name</Label>

        <Input
          value={formData.name}
          onChange={(e) =>
            setFormData({
              ...formData,
              name: e.target.value,
            })
          }
        />
      </div>

      <div className="space-y-2">
        <Label>Type</Label>

        <select
          value={formData.type}
          onChange={(e) =>
            setFormData({
              ...formData,
              type: e.target.value,
            })
          }
          className="w-full rounded-md border px-3 py-2"
        >
          <option value="">
            Select Type
          </option>

          <option value="text">
            Text
          </option>

          <option value="textarea">
            Textarea
          </option>

          <option value="number">
            Number
          </option>

          <option value="date">
            Date
          </option>

          <option value="select">
            Select
          </option>

          <option value="checkbox">
            Checkbox
          </option>

          <option value="radio">
            Radio
          </option>

          <option value="file">
            File
          </option>
        </select>
      </div>

      <Button
        onClick={onSubmit}
        disabled={loading}
      >
        {loading
          ? "Saving..."
          : "Save Field"}
      </Button>
    </div>
  );
}