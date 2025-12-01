import { useState, useCallback } from 'react';
import { User, SystemSettings, Task, Renewal, TaskStatus, RenewalStatus, TaskRecurrence } from '../types/index';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserService } from '@/shared/services';

export const useSystem = () => {
    const [users, setUsers] = useState<User[]>(UserService.getAll());
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
        const newUser = UserService.add(userData);
        setUsers(UserService.getAll());
        toast.success('Usuário adicionado com sucesso!');
    }, []);

    const updateUser = useCallback(async (updatedUser: User) => {
        UserService.update(updatedUser);
        setUsers(UserService.getAll());
    }, []);

    const deleteUser = useCallback(async (userId: string) => {
        UserService.delete(userId);
        setUsers(UserService.getAll());
        toast.success('Usuário removido com sucesso!');
    }, []);

    const refreshUsers = useCallback(async () => {
        setUsers(UserService.getAll());
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
                    status: TaskStatus.ToDo,
                    clientId: data.client_id,
                    dueDate: data.due_date,
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
                .update({ status: newStatus === TaskStatus.Done ? 'completed' : 'pending' })
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
