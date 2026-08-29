// ============================================================
// FILE: types/home/home.ts
// ============================================================

export interface HomepageStatistic {
  total_services: number;

  active_services: number;

  total_windows: number;

  total_officers: number;

  processed_applications: number;
}

export interface HomepageHero {
  title: string;

  subtitle: string;
}

export interface HomepageAnnouncement {
  id: number;

  title: string;

  description: string;

  status: string;

  created_at: string;
}

export interface HomepageFeaturedService {
  id: number;

  name: string;

  description?: string;

  status: string;

  service_fee: number;
}

export interface HomepageResponse {
  success: boolean;

  message: string;

  data: {
    hero: HomepageHero;

    statistics: HomepageStatistic;

    featured_services:
      HomepageFeaturedService[];

    announcements:
      HomepageAnnouncement[];
  };
}

export interface TrackApplicationPayload {
  application_number: string;
}

export interface TrackApplicationResponse {
  success: boolean;

  message: string;

  data: {
    id: number;

    application_number: string;

    status: string;

    created_at: string;

    service: {
      id: number;

      name: string;
    };

    customer: {
      id: number;

      name: string;
    };
  };
}

export interface ContactPayload {
  name: string;
  email: string;
  message: string;
}

export interface ContactResponse {
  success: boolean;
  message: string;
  data: null;
  meta?: null;
}
