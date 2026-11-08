import api, { clearSession, saveAccessToken, unwrap } from "@/lib/api";
import type { CustomerRegisterPayload } from "@/lib/auth/auth.schema";

export type AuthUser = {
  id?: number | string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string | null;
  gender?: string | null;
  date_of_birth?: string | null;
  city_id?: number | string | null;
  subcity_id?: number | string | null;
  woreda_id?: number | string | null;
  city?: { id?: number | string; name?: string | null } | null;
  subcity?: { id?: number | string; name?: string | null } | null;
  woreda?: { id?: number | string; name?: string | null } | null;
  profile_image?: string | null;
  profile_image_url?: string | null;
  photo_url?: string | null;
  role?: string;
  roles?: string[];
  permissions?: string[];
};

type LoginResponse = {
  token?: string;
  access_token?: string;
  user?: AuthUser;
  roles?: string[];
  permissions?: string[];
  data?: LoginResponse;
};

function normalizeUserResponse(response: any): AuthUser {
  const body = response?.data ?? response;

  return (body?.data ?? body?.user ?? body?.data?.user ?? body) as AuthUser;
}

function normalizeLoginResponse(response: unknown): LoginResponse {
  const value = response as LoginResponse;
  // Laravel returns access_token at the root and inside data. Keep both,
  // including the top-level user/roles when supplied by an auth endpoint.
  return value;
}

let currentUser: AuthUser | null = null;
let currentRoles: string[] = [];
let currentPermissions: string[] = [];

function rememberUser(user: AuthUser | null) {
  currentUser = user;
  currentRoles = user?.roles ?? (user?.role ? [user.role] : []);
  currentPermissions = user?.permissions ?? [];

  return user;
}

export const authService = {
  async login(credentials: { email?: string; phone?: string; password: string }) {
    const response = await api.post("/auth/login", credentials);
    const data = normalizeLoginResponse(unwrap<LoginResponse>(response));
    this.saveSession(data);

    return data;
  },

  async qrLogin(credential: string) {
    const response = await api.post("/auth/qr-login", { credential });
    const data = normalizeLoginResponse(unwrap<LoginResponse>(response));
    this.saveSession(data);
    return data;
  },

  async registerCustomer(payload: CustomerRegisterPayload) {
    const response = await api.post("/auth/register", payload);
    const data = normalizeLoginResponse(unwrap<LoginResponse>(response));
    this.saveSession(data);

    return data;
  },

  async me() {
    const response = await api.get("/auth/me");
    return rememberUser(normalizeUserResponse(response));
  },

  async refresh() {
    const response = await api.post("/auth/refresh");
    const data = normalizeLoginResponse(unwrap<LoginResponse>(response));
    this.saveSession(data);

    return data;
  },

  async profile() {
    try {
      const response = await api.get("/profile");
      return rememberUser(normalizeUserResponse(response));
    } catch (error) {
      // A 401 must end the authentication attempt, not trigger a second
      // protected request while the session is being cleared.
      throw error;
    }
  },

  async faydaLogin(code: string) {
    const response = await api.post("/auth/fayda/callback", { code });
    const data = normalizeLoginResponse(unwrap<LoginResponse>(response));
    this.saveSession(data);

    return data;
  },

  async updateProfile(payload: FormData) {
    const response = await api.post("/profile/update", payload, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return normalizeUserResponse(response);
  },

  async changeOwnPassword(payload: {
    current_password: string;
    new_password: string;
    new_password_confirmation: string;
  }) {
    const response = await api.post("/profile/change-password", payload);
    return unwrap<{ success: boolean; message: string }>(response);
  },

  async logout() {
    try {
      await api.post("/auth/logout");
    } finally {
      clearSession();
      currentUser = null;
      currentRoles = [];
      currentPermissions = [];
    }
  },

  saveSession(response: LoginResponse) {
    const token =
      response.token ??
      response.access_token ??
      response.data?.token ??
      response.data?.access_token;

    const user = response.user ?? response.data?.user ?? null;

    if (token) {
      saveAccessToken(token);
    }

    currentUser = user;
    currentRoles =
      response.roles ??
      response.data?.roles ??
      user?.roles ??
      (user?.role ? [user.role] : []);

    currentPermissions =
      response.permissions ??
      response.data?.permissions ??
      user?.permissions ??
      [];

    if (currentUser) {
      currentUser = {
        ...currentUser,
        roles: currentRoles,
        permissions: currentPermissions,
      };
    }
  },

  getStoredUser(): AuthUser | null {
    return currentUser;
  },

  getStoredRoles(): string[] {
    return currentRoles;
  },

  getStoredPermissions(): string[] {
    return currentPermissions;
  },
};
