import api, { unwrap } from "@/lib/api";

function bodyData<T = any>(response: any): T {
  const body = unwrap<any>(response);
  return (body?.data ?? body) as T;
}

function listFrom(value: any) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.data?.data)) return value.data.data;
  if (Array.isArray(value?.items)) return value.items;
  return [];
}

function metaFrom(value: any) {
  const data = value?.data ?? value;

  return {
    current_page: data?.current_page ?? value?.current_page ?? 1,
    last_page: data?.last_page ?? value?.last_page ?? 1,
    per_page: data?.per_page ?? value?.per_page ?? listFrom(value).length,
    total: data?.total ?? value?.total ?? listFrom(value).length,
  };
}

function formDataFromPayload(payload: any) {
  if (payload instanceof FormData) return payload;

  const source = {
    ...(payload || {}),
    ...(payload?.payload || {}),
  };

  const formData = new FormData();

  Object.entries(source).forEach(([key, value]) => {
    if (
      value === undefined ||
      value === null ||
      key === "id" ||
      key === "application_id" ||
      key === "action" ||
      key === "payload"
    ) {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => formData.append(`${key}[]`, item as any));
      return;
    }

    formData.append(key, value as any);
  });

  return formData;
}

async function postWorkflow(id: number, endpoint: string, payload: any = {}) {
  const response = await api.post(
    `/officer/applications/${id}/${endpoint}`,
    formDataFromPayload(payload),
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return bodyData(response);
}

export const managerWorkflowEndpoints = {
  queue: "/manager/applications/queue",
  show: (id: number) => `/manager/applications/${id}`,
  assignOfficer: (id: number) => `/manager/applications/${id}/assign-officer`,
  returnToOfficer: (id: number) => `/manager/applications/${id}/return-to-officer`,
  escalateUp: (id: number) => `/manager/applications/${id}/escalate-up`,
};

export const applicationWorkflowService = {
  officer: {
    certificateUrl(id: number) {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "/api";
      return `${baseUrl}/officer/applications/${id}/certificate`;
    },

    async queue(params?: Record<string, any>) {
      const response = await api.get("/officer/applications/queue", { params });
      const body = bodyData<any>(response);

      return {
        data: listFrom(body),
        meta: metaFrom(body),
      };
    },

    async show(id: number) {
      const response = await api.get(`/officer/applications/${id}`);
      return bodyData(response);
    },

    async action(payload: any) {
      const id = Number(payload?.id ?? payload?.application_id);
      const action = String(payload?.action || "");

      if (!id || !action) {
        throw new Error("Application id and action are required.");
      }

      const map: Record<string, string> = {
        accept: "accept",
        appointment: "appointment",
        set_appointment: "appointment",
        share: "share",
        share_to_officer: "share-to-officer",
        "share-to-officer": "share-to-officer",
        forward_to_back_officer: "forward-to-back-officer",
        approve: "approve",
        reject: "reject",
        return: "return",
        return_to_customer: "return",
        complete: "complete",
        escalate_to_manager: "escalate-to-manager",
      };

      const endpoint = map[action] || action.replaceAll("_", "-");

      return postWorkflow(id, endpoint, payload);
    },

    async backOfficerAction(payload: any) {
      return this.action(payload);
    },

    async frontOfficers(params?: Record<string, any>) {
      const response = await api.get("/officer/sharing/windows", { params });
      const body = bodyData(response);
      return listFrom(body);
    },

    async sharingWindows(params?: Record<string, any>) {
      const response = await api.get("/officer/sharing/windows", { params });
      const body = bodyData(response);
      return listFrom(body);
    },

    async sharingOfficers(windowId: number | string, params?: Record<string, any>) {
      const response = await api.get(`/officer/sharing/windows/${windowId}/officers`, { params });
      const body = bodyData(response);
      return listFrom(body);
    },
  },

  sharing: {
    async windows(params?: Record<string, any>) {
      const response = await api.get("/officer/sharing/windows", { params });
      const body = bodyData(response);
      return listFrom(body);
    },

    async officers(windowId: number | string, params?: Record<string, any>) {
      const response = await api.get(`/officer/sharing/windows/${windowId}/officers`, { params });
      const body = bodyData(response);
      return listFrom(body);
    },
  },

  manager: {
    async queue(params?: Record<string, any>) {
      const response = await api.get("/manager/applications/queue", { params });
      const body = bodyData<any>(response);

      return {
        data: listFrom(body),
        meta: metaFrom(body),
      };
    },

    async show(id: number) {
      const response = await api.get(`/manager/applications/${id}`);
      return bodyData(response);
    },

    async action(payload: any) {
      const id = Number(payload?.id ?? payload?.application_id);
      const action = String(payload?.action || "");

      if (!id || !action) {
        throw new Error("Application id and action are required.");
      }

      const map: Record<string, string> = {
        assign_officer: "assign-officer",
        return_to_officer: "return-to-officer",
        escalate_up: "escalate-up",
      };

      const endpoint = map[action] || action.replaceAll("_", "-");

      const response = await api.post(`/manager/applications/${id}/${endpoint}`, payload);
      return bodyData(response);
    },
  },

  applications: {
    async list(params?: Record<string, any>) {
      const response = await api.get("/admin/service-applications", { params });
      return bodyData(response);
    },

    async show(id: number) {
      const response = await api.get(`/admin/service-applications/${id}`);
      return bodyData(response);
    },
  },

  dashboard: {
    async summary() {
      const response = await api.get("/admin/applications/summary");
      return bodyData(response);
    },
  },

  forms: {
    async show(id: number) {
      const response = await api.get(`/admin/service-forms/${id}`);
      const form = bodyData<any>(response);

      return {
        form,
        steps: form?.steps ?? [],
        sections: form?.sections ?? [],
        fields: form?.fields ?? [],
        conditions: [
          ...(form?.fields ?? []).flatMap((field: any) => field?.conditions ?? []),
          ...(form?.sections ?? []).flatMap((section: any) =>
            (section?.fields ?? []).flatMap((field: any) => field?.conditions ?? [])
          ),
          ...(form?.steps ?? []).flatMap((step: any) =>
            (step?.sections ?? []).flatMap((section: any) =>
              (section?.fields ?? []).flatMap((field: any) => field?.conditions ?? [])
            )
          ),
        ],
      };
    },
  },

  steps: {
    async create(payload: any) {
      const response = await api.post("/admin/service-form-steps", payload);
      return bodyData(response);
    },

    async update(id: number, payload: any) {
      const response = await api.put(`/admin/service-form-steps/${id}`, payload);
      return bodyData(response);
    },

    async remove(id: number) {
      const response = await api.delete(`/admin/service-form-steps/${id}`);
      return bodyData(response);
    },
  },

  sections: {
    async create(payload: any) {
      const response = await api.post("/admin/service-form-sections", payload);
      return bodyData(response);
    },

    async update(id: number, payload: any) {
      const response = await api.put(`/admin/service-form-sections/${id}`, payload);
      return bodyData(response);
    },

    async remove(id: number) {
      const response = await api.delete(`/admin/service-form-sections/${id}`);
      return bodyData(response);
    },
  },

  fields: {
    async create(payload: any) {
      const response = await api.post("/admin/service-form-fields", payload);
      return bodyData(response);
    },

    async update(id: number, payload: any) {
      const body = {
        ...(payload || {}),
        service_form_section_id:
          payload?.service_form_section_id ?? payload?.section_id ?? null,
      };

      delete (body as any).id;
      delete (body as any).section_id;
      delete (body as any).conditions;
      delete (body as any).section;
      delete (body as any).step;
      delete (body as any).form;

      const response = await api.put(`/admin/service-form-fields/${id}`, body);
      return bodyData(response);
    },

    async remove(id: number) {
      const response = await api.delete(`/admin/service-form-fields/${id}`);
      return bodyData(response);
    },
  },

  conditions: {
    async create(payload: any) {
      const response = await api.post("/admin/service-form-field-conditions", payload);
      return bodyData(response);
    },

    async remove(id: number) {
      const response = await api.delete(`/admin/service-form-field-conditions/${id}`);
      return bodyData(response);
    },
  },

  builder: {
    async show(id: number) {
      return applicationWorkflowService.forms.show(id);
    },
  },
  serviceApplications: {},
};
