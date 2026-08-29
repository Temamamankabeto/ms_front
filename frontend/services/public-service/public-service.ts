import api, { unwrap } from "@/lib/api";

type PublicService = Record<string, any>;

type PublicServiceResponse = {
  success: boolean;
  message?: string;
  data: PublicService[];
  meta?: Record<string, any>;
};

type FeaturedServiceResponse = {
  success: boolean;
  message?: string;
  data: PublicService[];
};

type SinglePublicServiceResponse = {
  success: boolean;
  message?: string;
  data: PublicService;
};

type WindowGroupResponse = {
  success: boolean;
  message?: string;
  data: any[];
};

export type AdministrativeLevel =
  | "city"
  | "subcity"
  | "woreda";

export type LocationSelection = {
  administrative_level?: AdministrativeLevel;
  city_id?: number | string;
  subcity_id?: number | string;
  woreda_id?: number | string;
};

export const publicServiceService = {
  async locations() {
    const response = await api.get(
      "/public/locations"
    );

    return unwrap<{
      success: boolean;
      message: string;
      data: {
        cities: Array<{
          id: number;
          name: string;
          code?: string;
        }>;

        subcities: Array<{
          id: number;
          city_id: number;
          name: string;
        }>;

        woredas: Array<{
          id: number;
          city_id?: number;
          subcity_id: number;
          name: string;
        }>;
      };
    }>(response);
  },

  async getAll(
    page = 1,
    search = "",
    selection: LocationSelection = {}
  ): Promise<PublicServiceResponse> {
    const response = await api.get(
      "/public/services",
      {
        params: {
          page,
          search,
          per_page: 9,
          ...selection,
        },
      }
    );

    return unwrap<PublicServiceResponse>(
      response
    );
  },

  async featured(): Promise<FeaturedServiceResponse> {
    const response = await api.get(
      "/public/services/featured"
    );

    return unwrap<FeaturedServiceResponse>(
      response
    );
  },

  async show(
    id: number
  ): Promise<SinglePublicServiceResponse> {
    const response = await api.get(
      `/public/services/${id}`
    );

    return unwrap<SinglePublicServiceResponse>(
      response
    );
  },

  async windowServices(
    selection: LocationSelection = {}
  ): Promise<WindowGroupResponse> {
    const response = await api.get(
      "/public/window-services",
      {
        params: selection,
      }
    );

    return unwrap<WindowGroupResponse>(
      response
    );
  },
};