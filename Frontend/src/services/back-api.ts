import axios, { AxiosError } from "axios";

export enum UserRole {
  ADMIN = "admin",
  USER = "user",
  VIEWER = "viewer",
}

export interface Organization {
  id: string;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface Credit {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Score {
  id: string;
  value: number;
  createdAt: string;
  updatedAt: string;
}

export interface IntegrationData {
  id: string;
  provider: string;
  data: any;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  isActive: boolean;
  role: UserRole;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  organization?: Organization | null;
  credits?: Credit[];
  scores?: Score[];
  integrationData?: IntegrationData[];
  dni?: number | null;
  bcra_id?: string | null;
}

const BASE_URL = process.env.NEXT_PUBLIC_BACK_URL || "http://localhost:3001";
const api = axios.create({
  baseURL: BASE_URL,
  // Si tu backend autentica por cookie httpOnly, poner true y ajustar CORS en el server.
  withCredentials: false,
});

// ------- Meta Ads
export async function getMetaInsights(userId: string, month?: string) {
  const { data } = await api.get(`/meta-ads/${userId}/campaign-metrics`, {
    params: month ? { month } : undefined,
  });
  return data;
}

export async function getMetaAdAccounts(userId: string) {
  const { data } = await api.get(`/meta-ads/${userId}/adaccounts`);
  return data;
}

export async function linkMetaAdAccount(userId: string, accountId: string) {
  const { data } = await api.post(`/meta-ads/${userId}/adaccounts/link`, { accountId });
  return data;
}
export async function getMetaCampaigns(userId: string, accountId: string) {
  const { data } = await api.get(`/meta-ads/${userId}/adaccounts/${accountId}/campaigns`);
  return data;
}

export async function postMetaCampaignMetrics(userId: string, accountId: string, campaignId?: string, month?: string) {
  const payload: any = { accountId };
  if (campaignId) payload.campaignId = campaignId;
  if (month) payload.month = month;
  const { data } = await api.post(`/meta-ads/${userId}/campaign-metrics`, payload);
  return data;
}
export async function getMetaMetricsDiffLogin(userId: string) {
  const { data } = await api.get(`/meta-ads/${userId}/metrics-diff-login`);
  return data;
}
export async function getTiendaNubeMetricsDiffLogin(userId: string) {
  const { data } = await api.get(`/tiendanube/${userId}/metrics-diff-login`);
  return data;
}

// ---- REQUEST: agrega Authorization ----
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers = config.headers ?? {};
      (config.headers as any).Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ---- RESPONSE: refresh en 401 (una vez) ----
let isRefreshing = false;
let waiters: Array<() => void> = [];

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as any;

    // Si no es 401 o ya se reintentó, salir
    if (error.response?.status !== 401 || original?._retry) {
      return Promise.reject(error);
    }

    original._retry = true;

    try {
      if (isRefreshing) {
        // Esperar a que termine el refresh en curso
        await new Promise<void>((resolve) => waiters.push(resolve));
      } else {
        isRefreshing = true;

        const refresh =
          typeof window !== "undefined" ? localStorage.getItem("refresh_token") : null;

        if (!refresh) {
          // Sin refresh token: limpiar y rechazar
          if (typeof window !== "undefined") {
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
          }
          isRefreshing = false;
          return Promise.reject(error);
        }

        // Pedir nuevo access token
        const r = await axios.post(
          `${BASE_URL}/auth/refresh`,
          { refresh_token: refresh }, 
          { withCredentials: false }
        );
        console.log("[refresh] status", r.status, "data", r.data);
        const newAccess = (r.data as any)?.access_token ?? (r.data as any)?.accessToken;

        if (!newAccess) {
          throw new Error("No access token in /auth/refresh response");
        }

        localStorage.setItem("access_token", newAccess);
      }

      // Liberar cola y resetear estado
      waiters.forEach((fn) => fn());
      waiters = [];
      isRefreshing = false;

      // Reintentar request original con el nuevo token
      const newToken =
        typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

      original.headers = original.headers ?? {};
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
      }
      return api(original);
    } catch (e) {
      // Falló el refresh
      waiters.forEach((fn) => fn());
      waiters = [];
      isRefreshing = false;

      if (typeof window !== "undefined") {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.replace("/login");
      }

      return Promise.reject(e);
    }
  }
);

// ---- Helper: boot refresh si falta access token (usalo en el wrapper) ----
export async function ensureAccessToken(): Promise<boolean> {
  const access =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  if (access) return true;

  const refresh =
    typeof window !== "undefined" ? localStorage.getItem("refresh_token") : null;
  if (!refresh) return false;

  try {
    const r = await axios.post(
      `${BASE_URL}/auth/refresh`,
      { refresh_token: refresh },
      { withCredentials: false }
    );
    const newAccess = (r.data as any)?.access_token ?? (r.data as any)?.accessToken;
    if (!newAccess) return false;

    localStorage.setItem("access_token", newAccess);
    return true;
  } catch {
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
    }
    return false;
  }
}

// ------- Users
export async function getUsers() {
  const { data } = await api.get<User[]>("/users");
  return data;
}
export async function getUserById(id: string) {
  const { data } = await api.get<User>(`/users/${id}`);
  return data;
}
export async function createUser(userData: Partial<User>) {
  const { data } = await api.post<User>("/users", userData);
  return data;
}
export async function patchUserPassword(id: string, password: string) {
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    const { data } = await api.patch<{ message: string; updatedAt: string }>(
      `/users/${id}/password`,
      { password },
      token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
    );
    return data;
  } catch (e: any) {
    throw e?.response?.data?.message ? new Error(e.response.data.message) : e;
  }
}
export async function patchUserDni(id: string, dni: number) {
  try {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("access_token")
        : null;

    const config = token
      ? { headers: { Authorization: `Bearer ${token}` } }
      : {};

    const { data } = await api.patch(`/users/${id}/dni`, { dni }, config);
    return data;
  } catch (e: any) {
    throw e?.response?.data?.message
      ? new Error(e.response.data.message)
      : e;
  }
}
export async function patchJoinOrganization(id: string, organization: string) {
  const { data } = await api.patch(`/users/${id}/join-organization`, {
    organization,
  });
  return data;
}
export async function requestCredit(creditData: Partial<Credit> & { userId: string }) {
  const { data } = await api.post<Credit>("/credit/request", creditData);
  return data;
}
export async function updateCreditStatus(creditId: string, status: string) {
  const { data } = await api.patch<Credit>(`/credit/${creditId}/status`, { status });
  return data;
}
export async function updateOrganization(id: string, dataIn: { name?: string; phone?: string; address?: string }) {
  const { data } = await api.patch<Organization>(`/organizations/${id}`, dataIn);
  return data;
}
export async function patchJoinOrganizationMe(payload: { organizationId?: string; name?: string; phone?: string; address?: string }) {
  const { data } = await api.patch(`/users/me/join-organization`, payload);
  return data;
}

export default api;
