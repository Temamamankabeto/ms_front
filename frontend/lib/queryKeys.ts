export const queryKeys = {
  auth: {
    root: () => ["auth"] as const,
    me: () => ["auth", "me"] as const,
  },

  dashboard: {
    root: () => ["dashboard"] as const,
    byRole: (role?: string) => ["dashboard", role ?? "default"] as const,
  },

  users: {
    root: () => ["users"] as const,
    list: (filters?: unknown) => ["users", "list", filters] as const,
    detail: (id: string | number) => ["users", "detail", id] as const,
  },

  roles: {
    root: () => ["roles"] as const,
    list: (filters?: unknown) => ["roles", "list", filters] as const,
    lite: () => ["roles", "lite"] as const,
    permissions: (id: string | number) => ["roles", "permissions", id] as const,
  },

  permissions: {
    root: () => ["permissions"] as const,
    list: (filters?: unknown) => ["permissions", "list", filters] as const,
    all: (search?: string) => ["permissions", "all", search ?? ""] as const,
    catalog: (search?: string) => ["permissions", "catalog", search ?? ""] as const,
  },

  tables: {
    root: () => ["tables"] as const,
    list: (filters?: unknown, scope?: string) => ["tables", "list", scope ?? "admin", filters] as const,
    public: (filters?: unknown) => ["tables", "public", filters] as const,
    detail: (id: string | number) => ["tables", "detail", id] as const,
    summary: () => ["tables", "summary"] as const,
    sections: () => ["tables", "sections"] as const,
    history: (id: string | number) => ["tables", "history", id] as const,
    waiters: (search?: string) => ["tables", "waiters", search ?? ""] as const,
  },

  menu: {
    root: () => ["menu"] as const,
    categories: (filters?: unknown, scope?: string) => ["menu", "categories", scope ?? "admin", filters] as const,
    items: (filters?: unknown, scope?: string) => ["menu", "items", scope ?? "admin", filters] as const,
  },

  orders: {
    root: () => ["orders"] as const,
    list: (filters?: unknown, scope?: string) => ["orders", "list", scope ?? "admin", filters] as const,
    detail: (id: string | number, scope?: string) => ["orders", "detail", scope ?? "admin", id] as const,
  },

  credit: {
    root: () => ["credit"] as const,
    accounts: (filters?: unknown) => ["credit", "accounts", filters] as const,
    orders: (filters?: unknown) => ["credit", "orders", filters] as const,
  },

  prepTickets: {
    root: () => ["prepTickets"] as const,
    list: (kind?: string, filters?: unknown) => ["prepTickets", kind ?? "kitchen", filters] as const,
  },

  catering: {
    root: () => ["catering"] as const,
    packages: (filters?: unknown) => ["catering", "packages", filters] as const,
    package: (id: string | number) => ["catering", "package", id] as const,
    orders: (filters?: unknown) => ["catering", "orders", filters] as const,
    order: (id: string | number) => ["catering", "order", id] as const,
  },

  inventory: {
    root: () => ["inventory"] as const,
    items: (filters?: unknown, scope?: string) => ["inventory", "items", scope ?? "admin", filters] as const,
    transactions: (filters?: unknown, scope?: string) => ["inventory", "transactions", scope ?? "admin", filters] as const,
    batches: (filters?: unknown, scope?: string) => ["inventory", "batches", scope ?? "admin", filters] as const,
    recipes: (filters?: unknown, scope?: string) => ["inventory", "recipes", scope ?? "admin", filters] as const,
    menuItems: (filters?: unknown, scope?: string) => ["inventory", "menu-items", scope ?? "admin", filters] as const,
    lowStock: (scope?: string) => ["inventory", "low-stock", scope ?? "food-controller"] as const,
    valuation: (scope?: string) => ["inventory", "valuation", scope ?? "food-controller"] as const,
    recipeIntegrity: (scope?: string) => ["inventory", "recipe-integrity", scope ?? "food-controller"] as const,
    summary: (scope?: string) => ["inventory", "summary", scope ?? "food-controller"] as const,
  },

  billing: {
    root: () => ["billing"] as const,
    bills: (filters?: unknown) => ["billing", "bills", filters] as const,
    bill: (id: string | number) => ["billing", "bill", id] as const,
    payments: (filters?: unknown) => ["billing", "payments", filters] as const,
    refunds: (filters?: unknown) => ["billing", "refunds", filters] as const,
  },

  shifts: {
    root: () => ["shifts"] as const,
    current: () => ["shifts", "current"] as const,
    list: (filters?: unknown) => ["shifts", "list", filters] as const,
    detail: (id: string | number) => ["shifts", "detail", id] as const,
    xReport: () => ["shifts", "x-report"] as const,
    zReport: (id: string | number) => ["shifts", "z-report", id] as const,
  },

  reports: {
    root: () => ["reports"] as const,
    sales: (filters?: unknown) => ["reports", "sales", filters] as const,
    payments: (filters?: unknown) => ["reports", "payments", filters] as const,
    inventory: (filters?: unknown) => ["reports", "inventory", filters] as const,
    finance: (filters?: unknown) => ["reports", "finance", filters] as const,
  },
};

export type QueryKeys = typeof queryKeys;
