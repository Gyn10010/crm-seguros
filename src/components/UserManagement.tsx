/**
 * SECURITY NOTE - Authorization Check:
 * 
 * This component checks admin status using user_roles table (CORRECT approach).
 * ⚠️ NEVER check profiles.role for authorization - it's for display only!
 * ✅ ALWAYS verify admin role via user_roles.role = 'admin'
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { CloseIcon, EditIcon, TrashIcon } from './icons/Icons';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
  user_role?: 'admin' | 'user';
}

const PasswordResetModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onSubmit: (userId: string, password: string) => Promise<void>;
}> = ({ isOpen, onClose, user, onSubmit }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(user.id, newPassword);
      setNewPassword('');
      setConfirmPassword('');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-ui-card p-8 rounded-lg border border-ui-border w-full max-w-md relative shadow-2xl">
        <h2 className="text-2xl font-bold text-text-primary mb-6">Resetar Senha</h2>
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-text-secondary hover:text-text-primary transition-colors"
          aria-label="Fechar"
        >
          <CloseIcon />
        </button>
        
        <div className="mb-4">
          <p className="text-sm text-text-secondary">Usuário: <span className="font-medium text-text-primary">{user.name}</span></p>
          <p className="text-sm text-text-secondary">Email: <span className="font-medium text-text-primary">{user.email}</span></p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="newPassword">Nova Senha</Label>
            <Input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="confirmPassword">Confirmar Senha</Label>
            <Input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="mt-1"
            />
          </div>

          <div className="flex justify-end gap-4 pt-4 mt-6 border-t border-ui-border">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Resetar Senha'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  useEffect(() => {
    checkAdminStatus();
    loadUsers();
  }, []);

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

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Get user roles
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .eq('role', 'admin');

      const adminIds = new Set(rolesData?.map(r => r.user_id) || []);

      const usersWithRoles = profilesData?.map(profile => ({
        ...profile,
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

  const handleResetPassword = async (userId: string, newPassword: string) => {
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

      toast.success('Senha resetada com sucesso');
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao resetar senha');
      throw error;
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
    <div className="bg-ui-card p-6 rounded-lg border border-ui-border shadow-sm">
      <h2 className="text-2xl font-bold text-text-primary mb-6">Gerenciamento de Usuários</h2>
      
      <div className="overflow-x-auto">
        <table className="min-w-full bg-ui-card">
          <thead className="bg-ui-card">
            <tr>
              <th className="py-3 px-6 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Nome</th>
              <th className="py-3 px-6 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Email</th>
              <th className="py-3 px-6 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Função</th>
              <th className="py-3 px-6 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Perfil</th>
              <th className="py-3 px-6 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ui-border">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-ui-hover">
                <td className="py-4 px-6 whitespace-nowrap text-sm font-medium text-text-primary">{user.name}</td>
                <td className="py-4 px-6 whitespace-nowrap text-sm text-text-secondary">{user.email}</td>
                <td className="py-4 px-6 whitespace-nowrap text-sm text-text-secondary">{user.role}</td>
                <td className="py-4 px-6 whitespace-nowrap text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user.user_role === 'admin' 
                      ? 'bg-brand-primary/10 text-brand-primary' 
                      : 'bg-ui-border text-text-secondary'
                  }`}>
                    {user.user_role === 'admin' ? 'Admin' : 'Usuário'}
                  </span>
                </td>
                <td className="py-4 px-6 whitespace-nowrap text-sm text-text-secondary">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedUser(user);
                        setIsPasswordModalOpen(true);
                      }}
                    >
                      Resetar Senha
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleUserRole(user.id, user.user_role || 'user')}
                    >
                      {user.user_role === 'admin' ? 'Remover Admin' : 'Tornar Admin'}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <p className="text-center text-text-muted mt-6">Nenhum usuário encontrado.</p>
      )}

      <PasswordResetModal
        isOpen={isPasswordModalOpen}
        onClose={() => {
          setIsPasswordModalOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        onSubmit={handleResetPassword}
      />
    </div>
  );
};

export default UserManagement;
