import { useState, useCallback } from 'react';
import { Client } from '../types/index';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useClients = () => {
    const [clients, setClients] = useState<Client[]>([]);

    const addClient = useCallback(async (clientData: Omit<Client, 'id' | 'createdAt'>) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error('Usuário não autenticado');
                return;
            }

            const { data, error } = await supabase
                .from('clients')
                .insert({
                    name: clientData.name,
                    email: clientData.email,
                    phone: clientData.phone,
                    address: clientData.address,
                    person_type: clientData.personType,
                    city: clientData.city,
                    state: clientData.state,
                    cpf_cnpj: clientData.cpfCnpj,
                    birth_date: clientData.birthDate,
                    user_id: user.id
                })
                .select()
                .single();

            if (error) throw error;

            if (data) {
                const newClient: Client = {
                    id: data.id,
                    name: data.name,
                    email: data.email,
                    phone: data.phone,
                    address: data.address,
                    personType: data.person_type as 'Física' | 'Jurídica',
                    city: data.city,
                    state: data.state,
                    cpfCnpj: data.cpf_cnpj,
                    birthDate: data.birth_date,
                    createdAt: data.created_at.split('T')[0],
                };
                setClients(prev => [...prev, newClient]);
                toast.success('Cliente adicionado com sucesso!');
            }
        } catch (error) {
            console.error('Error adding client:', error);
            toast.error('Erro ao adicionar cliente');
        }
    }, []);

    const updateClient = useCallback(async (updatedClient: Client) => {
        try {
            const { error } = await supabase
                .from('clients')
                .update({
                    name: updatedClient.name,
                    email: updatedClient.email,
                    phone: updatedClient.phone,
                    address: updatedClient.address,
                    person_type: updatedClient.personType,
                    city: updatedClient.city,
                    state: updatedClient.state,
                    cpf_cnpj: updatedClient.cpfCnpj,
                    birth_date: updatedClient.birthDate,
                })
                .eq('id', updatedClient.id);

            if (error) throw error;

            setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
            toast.success('Cliente atualizado com sucesso!');
        } catch (error) {
            console.error('Error updating client:', error);
            toast.error('Erro ao atualizar cliente');
        }
    }, []);

    const deleteClient = useCallback(async (clientId: string) => {
        try {
            const { error } = await supabase
                .from('clients')
                .delete()
                .eq('id', clientId);

            if (error) throw error;

            setClients(prev => prev.filter(c => c.id !== clientId));
            toast.success('Cliente excluído com sucesso!');
        } catch (error) {
            console.error('Error deleting client:', error);
            toast.error('Erro ao excluir cliente');
        }
    }, []);

    return {
        clients,
        setClients,
        addClient,
        updateClient,
        deleteClient
    };
};
