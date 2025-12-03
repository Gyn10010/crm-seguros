/**
 * SECURITY NOTE - Authorization Check:
 * 
 * This component checks admin status using user_roles table (CORRECT approach).
 * ⚠️ NEVER check profiles.role for authorization - it's for display only!
 * ✅ ALWAYS verify admin role via user_roles.role = 'admin'
 */

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { CloseIcon, EditIcon, TrashIcon } from './icons/Icons';
import { Page } from '@/types';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar_url?: string | null;
  permissions?: Page[] | null;
  created_at: string;
  user_role?: 'admin' | 'user';
}

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const pageNames: { [key in Page]?: string } = {
  [Page.Dashboard]: 'Dashboard',
  [Page.Clients]: 'Clientes',
  [Page.Policies]: 'Apólices',
  [Page.Tasks]: 'Tarefas',
  [Page.Renewals]: 'Renovações',
  [Page.Settings]: 'Configurações',
  [Page.InsuranceCompanies]: 'Seguradoras',
  [Page.SalesFunnel]: 'Funil de Vendas',
};

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [jobRoles, setJobRoles] = useState<string[]>([]);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [userFormData, setUserFormData] = useState<Omit<UserProfile, 'id' | 'created_at' | 'user_role'>>({
    name: '',
    email: '',
    role: '',
    permissions: [],
    avatar_url: '',
  });
  const [password, setPassword] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    checkAdminStatus();
    loadUsers();
    loadJobRoles();
  }, []);

  useEffect(() => {
    if (editingUser) {
      setUserFormData({
        name: editingUser.name,
        email: editingUser.email,
        role: editingUser.role,
        permissions: editingUser.permissions || [],
        avatar_url: editingUser.avatar_url || '',
      });
      setAvatarPreview(editingUser.avatar_url || null);
    }
  }, [editingUser]);

  const checkAdminStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    setIsAdmin(!!data);
  };

  const loadJobRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('job_roles')
        .select('name')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setJobRoles(data?.map(r => r.name) || []);
    } catch (error) {
      console.error('Error loading job roles:', error);
      toast.error('Erro ao carregar cargos');
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .eq('role', 'admin');

      const adminIds = new Set(rolesData?.map(r => r.user_id) || []);

      const usersWithRoles = profilesData?.map(profile => ({
        ...profile,
        permissions: profile.permissions as Page[] | null,
        user_role: adminIds.has(profile.id) ? 'admin' as const : 'user' as const
      })) || [];

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenUserModal = (user: UserProfile | null = null) => {
    setEditingUser(user);
    if (!user) {
      setUserFormData({ name: '', email: '', role: jobRoles[0] || '', permissions: [], avatar_url: '' });
      setPassword('');
      setAvatarPreview(null);
    }
    setIsUserModalOpen(true);
  };

  const handleCloseUserModal = () => {
    setIsUserModalOpen(false);
    setEditingUser(null);
    setPassword('');
  };

  const handleUserFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUserFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setUserFormData(prev => ({ ...prev, avatar_url: result }));
        setAvatarPreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePermissionChange = (page: Page) => {
    setUserFormData(prev => {
      const currentPermissions = prev.permissions || [];
      const newPermissions = currentPermissions.includes(page)
        ? currentPermissions.filter(p => p !== page)
        : [...currentPermissions, page];
      return { ...prev, permissions: newPermissions };
    });
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingUser) {
        const { error } = await supabase
          .from('profiles')
          .update({
            name: userFormData.name,
            role: userFormData.role,
            avatar_url: userFormData.avatar_url,
            permissions: userFormData.permissions,
          })
          .eq('id', editingUser.id);

        if (error) {
          console.error('Error updating profile:', error);
          toast.error(`Erro ao atualizar usuário: ${error.message || 'Erro desconhecido'}`);
          setIsSubmitting(false);
          return;
        }

        toast.success(`Usuário atualizado! Permissões: ${(userFormData.permissions || []).length} selecionadas`);
        await loadUsers();
      } else {
        if (!password || password.length < 6) {
          toast.error('A senha deve ter pelo menos 6 caracteres');
          setIsSubmitting(false);
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          toast.error('Sessão expirada');
          setIsSubmitting(false);
          return;
        }

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: userFormData.email,
              password: password,
              name: userFormData.name,
              role: userFormData.role,
              avatar_url: userFormData.avatar_url,
              permissions: userFormData.permissions,
            }),
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Erro ao criar usuário');
        }

        await loadUsers();
        toast.success('Usuário criado com sucesso! Ele já pode fazer login.');
      }
      handleCloseUserModal();
    } catch (error) {
      console.error('Error managing user:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao gerenciar usuário');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (userId: string) => {
    const newPassword = prompt('Digite a nova senha (mínimo 6 caracteres):');

    if (!newPassword) return;

    if (newPassword.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Sessão expirada');
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reset-user-password`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId, newPassword }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao resetar senha');
      }

      toast.success('Senha resetada com sucesso!');
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao resetar senha');
    }
  };

  const toggleUserRole = async (userId: string, currentRole: 'admin' | 'user') => {
    try {
      if (currentRole === 'admin') {
        await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', 'admin');
      } else {
        await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: 'admin' });
      }

      toast.success(`Usuário ${currentRole === 'admin' ? 'removido de' : 'promovido a'} administrador`);
      loadUsers();
    } catch (error) {
      console.error('Error toggling role:', error);
      toast.error('Erro ao alterar perfil do usuário');
    }
  };

  if (!isAdmin) {
    return (
      <div className="bg-ui-card p-6 rounded-lg border border-ui-border shadow-sm">
        <p className="text-text-secondary">Você não tem permissão para acessar esta área.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-ui-card p-6 rounded-lg border border-ui-border shadow-sm">
        <p className="text-text-secondary">Carregando usuários...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={() => handleOpenUserModal()} className="bg-blue-600 hover:bg-blue-700 text-white">
          + Adicionar Usuário
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-ui-card">
          <thead className="bg-ui-card">
            <tr>
              <th className="py-3 px-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Nome</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Email</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Cargo</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ui-border">
            {users.map(user => (
              <tr key={user.id}>
                <td className="py-2 px-4 whitespace-nowrap text-sm font-medium text-text-primary">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-ui-hover overflow-hidden flex-shrink-0">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt={user.name} className="h-full w-full object-cover" />
                      ) : (
                        <span className="h-full w-full flex items-center justify-center text-xs font-bold text-text-secondary">{getInitials(user.name)}</span>
                      )}
                    </div>
                    {user.name}
                  </div>
                </td>
                <td className="py-4 px-4 whitespace-nowrap text-sm text-text-secondary">{user.email}</td>
                <td className="py-4 px-4 whitespace-nowrap text-sm text-text-secondary">{user.role}</td>
                <td className="py-4 px-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleOpenUserModal(user)} className="text-text-secondary hover:text-brand-primary transition-colors" title="Editar">
                      <EditIcon />
                    </button>
                    <button
                      onClick={() => handleResetPassword(user.id)}
                      className="text-xs px-2 py-1 rounded bg-ui-border hover:bg-ui-hover transition-colors"
                      title="Resetar Senha"
                    >
                      Resetar Senha
                    </button>
                    <button onClick={() => toggleUserRole(user.id, user.user_role || 'user')} className="text-xs px-2 py-1 rounded bg-ui-border hover:bg-ui-hover transition-colors">
                      {user.user_role === 'admin' ? 'Remover Admin' : 'Admin'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-ui-card p-8 rounded-lg border border-ui-border w-full max-w-2xl max-h-[90vh] overflow-y-auto relative shadow-2xl">
            <h2 className="text-2xl font-bold text-text-primary mb-6">{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</h2>
            <button type="button" onClick={handleCloseUserModal} className="absolute top-4 right-4 text-text-secondary hover:text-text-primary transition-colors" aria-label="Fechar">
              <CloseIcon />
            </button>
            <form ref={formRef} onSubmit={handleUserSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Foto de Perfil</label>
                <div className="mt-1 flex items-center gap-4">
                  <span className="inline-block h-16 w-16 rounded-full overflow-hidden bg-ui-hover">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                      <svg className="h-full w-full text-text-muted" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 20.993V24H0v-2.997A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    )}
                  </span>
                  <input type="file" id="avatar-upload" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                  <label htmlFor="avatar-upload" className="cursor-pointer bg-ui-card text-text-secondary border border-ui-border rounded-md py-2 px-3 text-sm font-medium hover:bg-ui-hover">
                    Alterar
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-text-secondary mb-1">Nome</label>
                  <input type="text" name="name" id="name" value={userFormData.name} onChange={handleUserFormChange} required className="mt-1 block w-full px-3 py-2 border border-ui-border bg-white rounded-md shadow-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary" />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-1">Email</label>
                  <input type="email" name="email" id="email" value={userFormData.email} onChange={handleUserFormChange} required disabled={!!editingUser} className="mt-1 block w-full px-3 py-2 border border-ui-border bg-white rounded-md shadow-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:opacity-50" />
                </div>
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-text-secondary mb-1">Cargo</label>
                  <select name="role" id="role" value={userFormData.role} onChange={handleUserFormChange} required className="mt-1 block w-full px-3 py-2 border border-ui-border bg-white rounded-md shadow-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary">
                    <option value="">Selecione um cargo</option>
                    {jobRoles.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
                {!editingUser && (
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-1">Senha</label>
                    <input
                      type="password"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required={!editingUser}
                      minLength={6}
                      placeholder="Mínimo 6 caracteres"
                      className="mt-1 block w-full px-3 py-2 border border-ui-border bg-white rounded-md shadow-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    />
                  </div>
                )}
              </div>
              <div>
                <h3 className="block text-sm font-medium text-text-secondary mb-2">Permissões de Visualização</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 border border-ui-border p-3 rounded-md">
                  {Object.values(Page).filter(p => pageNames[p]).map(page => (
                    <label key={page} className="flex items-center text-sm">
                      <input
                        type="checkbox"
                        checked={(userFormData.permissions || []).includes(page)}
                        onChange={() => handlePermissionChange(page)}
                        className="mr-2 h-4 w-4 rounded border-ui-border text-brand-primary focus:ring-brand-primary"
                      />
                      {pageNames[page]}
                    </label>
                  ))}
                </div>
                <p className="text-xs text-text-muted mt-2">
                  Nota: Apenas administradores têm acesso total a "Gerenciamento de Usuários" dentro de Configurações.
                </p>
              </div>
              <div className="flex justify-end gap-4 pt-4 mt-6 border-t border-ui-border">
                <Button type="button" variant="outline" onClick={handleCloseUserModal}>Cancelar</Button>
                <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white">
                  {isSubmitting ? 'Processando...' : (editingUser ? 'Salvar' : 'Criar Usuário')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
