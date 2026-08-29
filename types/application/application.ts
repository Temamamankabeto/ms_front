export interface Application {
  id: number;
  tracking_number: string;
  status: string;
  submitted_at: string;

  service: {
    id: number;
    name: string;
  };
}

export interface ApplyPayload {
  data: Record<string, any>;
  files?: Record<string, File>;
}

export interface TrackPayload {
  tracking_number: string;
}


// officer appli  will be able to see the application details and update the status of the application

export interface OfficerApplicationActionPayload {
  remark?: string;
}