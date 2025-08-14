// Componente UserProfile
// Muestra información del usuario logueado.
import { useAppStore } from '../store';
import LogoutButton from './LogoutButton';

export default function UserProfile() {
  const user = useAppStore((state) => state.user);
  if (!user) return <div>No hay usuario autenticado</div>;
  return (
    <div className="p-4 border rounded bg-white shadow">
      <h2 className="text-lg font-bold mb-2">Perfil de usuario</h2>
      <div>Email: {user.email}</div>
      <div>Nombre: {user.name}</div>
      <div>Rol: {user.role}</div>
      <div>Organización: {user.organization?.name || 'Sin organización'}</div>
      <div>Creado: {user.createdAt}</div>
      <LogoutButton />
    </div>
  );
}
