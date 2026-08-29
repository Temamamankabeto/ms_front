import api, { unwrap } from "@/lib/api";

function appendApplicationData(
  payload: FormData,
  values: Record<string, unknown>,
  files: Record<string, File | null>,
  selection: {
    administrative_level: string;
    city_id: number;
    subcity_id?: number | null;
    woreda_id?: number | null;
  }   
) {
  payload.append("administrative_level", selection.administrative_level);
  payload.append("city_id", String(selection.city_id));

  if (selection.subcity_id) {
    payload.append("subcity_id", String(selection.subcity_id));
  }

  if (selection.woreda_id) {
    payload.append("woreda_id", String(selection.woreda_id));
  }

  Object.entries(values).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    if (Array.isArray(value)) {
      value.forEach((item) => payload.append(`data[${key}][]`, String(item)));
      return;
    }

    payload.append(`data[${key}]`, String(value));
  });

  Object.entries(files).forEach(([key, file]) => {
    if (file) payload.append(`files[${key}]`, file);
  });
}

export const applicationService = {
  async getForm(serviceId: number) {
    const response = await api.get(`/public/services/${serviceId}/form`);

    return unwrap(response);
  },

  async apply(
    serviceId: number,
    values: Record<string, unknown>,
    files: Record<string, File | null> = {},
    selection: {
      administrative_level: string;
      city_id: number;
      subcity_id?: number | null;
      woreda_id?: number | null;
    }
  ) {
    const payload = new FormData();

    appendApplicationData(payload, values, files, selection);

    const response = await api.post(`/public/services/${serviceId}/apply`, payload, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return unwrap(response);
  },


  async details(id: number) {
    const response = await api.get(`/customer/service-applications/${id}`);
    return unwrap(response);
  },

  async resubmit(id: number, input: FormData | { values?: Record<string, unknown>; files?: Record<string, File | null> }) {
    const payload = input instanceof FormData ? input : new FormData();

    if (!(input instanceof FormData)) {
      Object.entries(input.values ?? {}).forEach(([key, value]) => {
        if (value === undefined || value === null) return;

        if (Array.isArray(value)) {
          value.forEach((item) => payload.append(`data[${key}][]`, String(item)));
          return;
        }

        payload.append(`data[${key}]`, String(value));
      });

      Object.entries(input.files ?? {}).forEach(([key, file]) => {
        if (file) payload.append(`files[${key}]`, file);
      });
    }

    const response = await api.post(`/customer/service-applications/${id}/resubmit`, payload, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return unwrap(response);
  },

  async track(payload: string | { tracking_number?: string; application_number?: string; tracking?: string }) {
    const trackingNumber =
      typeof payload === "string"
        ? payload
        : payload.tracking_number ?? payload.application_number ?? payload.tracking;

    const response = await api.post("/public/track-application", {
      tracking_number: trackingNumber,
    });

    const body = unwrap<{ success: boolean; message: string; data: any }>(response);

    return body.data;
  },
};
