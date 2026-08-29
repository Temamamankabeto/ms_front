// Merge these methods into applicationWorkflowService if you want custom manager UI.
export const managerWorkflowEndpoints = {
  queue: '/manager/applications/queue',
  show: (id: number) => `/manager/applications/${id}`,
  assignOfficer: (id: number) => `/manager/applications/${id}/assign-officer`,
  returnToOfficer: (id: number) => `/manager/applications/${id}/return-to-officer`,
  escalateUp: (id: number) => `/manager/applications/${id}/escalate-up`,
};
