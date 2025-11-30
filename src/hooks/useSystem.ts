import { useState, useCallback } from 'react';
import { User, SystemSettings, Task, Renewal, TaskStatus, RenewalStatus, TaskRecurrence } from '../types/index';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useSystem = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [systemSettings, setSystemSettings] = useState<SystemSettings>({
        companyName: 'LDR Corretora',
        themeColor: '#0047AB',
        renewalAlertDays: 30,
        currency: 'BRL',
    });
    const [tasks, setTasks] = useState<Task[]>([]);
    const [renewals, setRenewals] = useState<Renewal[]>([]);

    // User Management
    const addUser = useCallback(async (userData: Omit<User, 'id'>) => {
        // Note: Actual user creation in Supabase Auth is handled via Edge Function or client-side signUp.
        // This function updates the local state after successful creation.
        // For simplicity in this refactor, we'll keep the local state update logic here.
        // The actual API call is usually done in the component (e.g., Settings.tsx).
        const newUser: User = {
            ...userData,
            id: `u-${Date.now()}`, // Temporary ID, should be replaced by real ID from Auth
        };
        setUsers(prev => [...prev, newUser]);
    }, []);

    const updateUser = useCallback(async (updatedUser: User) => {
        try {
            const { error } = await supabase
                .from('user_roles')
                .update({ role: updatedUser.role }) // Only role is in user_roles for now
                .eq('user_id', updatedUser.id);

            if (error) throw error;

            // Also update profiles if needed (name, avatar)
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    full_name: updatedUser.name,
                    avatar_url: updatedUser.avatarUrl,
                    role: updatedUser.role // Display role
                })
                .eq('id', updatedUser.id);

            if (profileError) throw profileError;

            setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
            toast.success('Usuário atualizado com sucesso!');
        } catch (error) {
            console.error('Error updating user:', error);
            toast.error('Erro ao atualizar usuário');
        }
    }, []);

    const deleteUser = useCallback(async (userId: string) => {
        // Deleting users usually requires admin API call
        setUsers(prev => prev.filter(u => u.id !== userId));
        toast.info('Usuário removido da lista local (requer admin para remover do Auth)');
    }, []);

    const refreshUsers = useCallback(async () => {
        const { data: profiles } = await supabase.from('profiles').select('*');
        if (profiles) {
            const mappedUsers: User[] = profiles.map(p => ({
                id: p.id,
                name: p.name || 'Usuário',
                email: p.email || 'email@exemplo.com',
                role: (p.role === 'Gestor' || p.role === 'Vendedor') ? p.role : 'Vendedor',
                permissions: [],
                avatarUrl: p.avatar_url || '',
            }));
            setUsers(mappedUsers);
        }
    }, []);

    // System Settings Management
    const updateSystemSettings = useCallback((newSettings: Partial<SystemSettings>) => {
        setSystemSettings(prev => ({ ...prev, ...newSettings }));
        // Persist to DB if needed (not implemented in original code yet)
    }, []);

    // Task Management
    const addTask = useCallback(async (taskData: Omit<Task, 'id' | 'status'>) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error('Usuário não autenticado');
                return;
            }

            const { data, error } = await supabase
                .from('tasks')
                .insert({
                    title: taskData.title,
                    description: taskData.description,
                    status: 'pending',
                    client_id: taskData.clientId,
                    due_date: taskData.dueDate,
                    priority: taskData.priority,
                    recurrence: taskData.recurrence,
                    user_id: user.id
                })
                .select()
                .single();

            if (error) throw error;

            if (data) {
                const newTask: Task = {
                    id: data.id,
                    title: data.title,
                    description: data.description || '',
                    status: TaskStatus.Pending,
                    clientId: data.client_id,
                    dueDate: data.due_date,
                    priority: data.priority as 'low' | 'medium' | 'high',
                    recurrence: data.recurrence as TaskRecurrence,
                };
                setTasks(prev => [...prev, newTask]);
                toast.success('Tarefa adicionada com sucesso!');
            }
        } catch (error) {
            console.error('Error adding task:', error);
            toast.error('Erro ao adicionar tarefa');
        }
    }, []);

    const updateTaskStatus = useCallback(async (taskId: string, newStatus: TaskStatus) => {
        try {
            const { error } = await supabase
                .from('tasks')
                .update({ status: newStatus === TaskStatus.Completed ? 'completed' : 'pending' })
                .eq('id', taskId);

            if (error) throw error;

            setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
        } catch (error) {
            console.error('Error updating task status:', error);
            toast.error('Erro ao atualizar status da tarefa');
        }
    }, []);

    const updateTask = useCallback(async (updatedTask: Task) => {
        try {
            const { error } = await supabase
                .from('tasks')
                .update({
                    title: updatedTask.title,
                    description: updatedTask.description,
                    client_id: updatedTask.clientId,
                    due_date: updatedTask.dueDate,
                    priority: updatedTask.priority,
                    recurrence: updatedTask.recurrence,
                })
                .eq('id', updatedTask.id);

            if (error) throw error;

            setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
            toast.success('Tarefa atualizada com sucesso!');
        } catch (error) {
            console.error('Error updating task:', error);
            toast.error('Erro ao atualizar tarefa');
        }
    }, []);

    // Renewal Management
    const updateRenewal = useCallback(async (updatedRenewal: Renewal) => {
        try {
            const { error } = await supabase
                .from('renewals')
                .update({
                    status: updatedRenewal.status,
                    notes: updatedRenewal.notes
                })
                .eq('policy_id', updatedRenewal.policyId); // Assuming policy_id is unique for renewal tracking

            if (error) throw error;

            setRenewals(prev => prev.map(r => r.policyId === updatedRenewal.policyId ? updatedRenewal : r));
            toast.success('Renovação atualizada com sucesso!');
        } catch (error) {
            console.error('Error updating renewal:', error);
            toast.error('Erro ao atualizar renovação');
        }
    }, []);

    return {
        users,
        setUsers,
        systemSettings,
        setSystemSettings,
        tasks,
        setTasks,
        renewals,
        setRenewals,
        addUser,
        updateUser,
        deleteUser,
        refreshUsers,
        updateSystemSettings,
        addTask,
        updateTaskStatus,
        updateTask,
        updateRenewal
    };
};
