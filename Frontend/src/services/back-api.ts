// Servicio de API backend
// Configura axios para llamadas al backend y manejo de tokens.
import axios from 'axios';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  VIEWER = 'viewer',
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
  organization?: Organization;
  credits?: Credit[];
  scores?: Score[];
  integrationData?: IntegrationData[];
}

const api = axios.create({
  baseURL: process.env.BACK_URL || 'http://localhost:3001',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


/**
 * Obtiene todos los usuarios del backend.
 * @returns {Promise<any[]>} Lista de usuarios
 */
export async function getUsers(): Promise<User[]> {
  const response = await api.get<User[]>('/users');
  return response.data;
}

/**
 * Obtiene un usuario por su ID.
 * @param {string} id - ID del usuario
 * @returns {Promise<any>} Usuario encontrado
 */
export async function getUserById(id: string): Promise<User> {
  const response = await api.get<User>(`/users/${id}`);
  return response.data;
}

/**
 * Crea un nuevo usuario.
 * @param {object} userData - Datos del usuario
 * @returns {Promise<any>} Usuario creado
 */
export async function createUser(userData: Partial<User>): Promise<User> {
  const response = await api.post<User>('/users', userData);
  return response.data;
}

/**
 * Actualiza el password de un usuario.
 * @param {string} id - ID del usuario
 * @param {string} password - Nuevo password
 * @returns {Promise<any>} Resultado de la actualización
 */
export async function updateUserPassword(id: string, password: string): Promise<{ message: string; updatedAt: string }> {
  const response = await api.patch<{ message: string; updatedAt: string }>(`/users/${id}/password`, { password });
  return response.data;
}

/**
 * Elimina un usuario por su ID.
 * @param {string} id - ID del usuario
 * @returns {Promise<any>} Resultado de la eliminación
 */
export async function deleteUser(id: string): Promise<{ message: string }> {
  const response = await api.delete<{ message: string }>(`/users/${id}`);
  return response.data;
}

/**
 * Solicita un crédito para un usuario.
 * @param {object} creditData - Datos del crédito
 * @returns {Promise<any>} Crédito solicitado
 */
export async function requestCredit(creditData: Partial<Credit> & { userId: string }): Promise<Credit> {
  const response = await api.post<Credit>('/credit/request', creditData);
  return response.data;
}

/**
 * Actualiza el estado de un crédito (solo admin).
 * @param {string} creditId - ID del crédito
 * @param {string} status - Estado nuevo ('pending', 'approved', 'rejected')
 * @returns {Promise<any>} Crédito actualizado
 */
export async function updateCreditStatus(creditId: string, status: string): Promise<Credit> {
  const response = await api.patch<Credit>(`/credit/${creditId}/status`, { status });
  return response.data;
}

/**
 * Actualiza los datos de una organización.
 * @param {string} id - ID de la organización
 * @param {object} data - Datos a modificar (name, phone, address)
 * @returns {Promise<any>} Organización actualizada
 */
export async function updateOrganization(id: string, data: { name?: string; phone?: string; address?: string }): Promise<Organization> {
  const response = await api.patch<Organization>(`/organizations/${id}`, data);
  return response.data;
}

export default api;
