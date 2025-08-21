// services/back-api.ts
import axios from "axios";

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
}

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACK_URL || "http://localhost:3001",
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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
  const { data } = await api.patch<{ message: string; updatedAt: string }>(
    `/users/${id}/password`,
    { password }
  );
  return data;
}

export async function patchUserDni(id: string, dni: number) {
  const { data } = await api.patch(`/users/${id}/dni`, { dni });
  return data;
}

export async function patchJoinOrganization(id: string, organization: string) {
  const { data } = await api.patch(`/users/${id}/join-organization`, {
    organization,
  });
  return data;
}

// ------- Credits (lo que ya tenías)
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
