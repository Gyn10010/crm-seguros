import { useState, useCallback } from 'react';
import { Opportunity, FunnelActivity, DealType } from '../types/index';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useOpportunities = () => {
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [origins, setOrigins] = useState<string[]>([]);

    // Opportunity Management
    const addOpportunity = useCallback(async (opportunityData: Omit<Opportunity, 'id' | 'createdAt' | 'stage' | 'activities'>) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error('Usuário não autenticado');
                return;
            }

            // Get initial stage for the funnel
            const { data: stages } = await supabase
                .from('funnel_stages')
                .select('stage_name')
                .eq('funnel_key', opportunityData.funnelType)
                .order('order_index', { ascending: true })
                .limit(1);

            const initialStage = stages && stages.length > 0 ? stages[0].stage_name : 'Prospecção';

            const { data, error } = await supabase
                .from('opportunities')
                .insert({
                    funnel_type: opportunityData.funnelType,
                    stage: initialStage,
                    title: opportunityData.title,
                    client_id: opportunityData.clientId,
                    value: opportunityData.value,
                    commission: opportunityData.commission,
                    expected_close_date: opportunityData.expectedCloseDate,
                    deal_type: opportunityData.dealType,
                    salesperson: opportunityData.salesperson,
                    origin: opportunityData.origin,
                    technical_responsible: opportunityData.technicalResponsible,
                    renewal_responsible: opportunityData.renewalResponsible,
                    insurance_type: opportunityData.insuranceType,
                    insurance_company: opportunityData.insuranceCompany,
                    notes: opportunityData.notes || null,
                    user_id: user.id
                })
                .select()
                .single();

            if (error) throw error;

            if (data) {
                const newOpportunity: Opportunity = {
                    id: data.id,
                    funnelType: data.funnel_type,
                    stage: data.stage,
                    title: data.title,
                    clientId: data.client_id,
                    value: typeof data.value === 'string' ? parseFloat(data.value) : data.value,
                    commission: typeof data.commission === 'string' ? parseFloat(data.commission) : data.commission,
                    expectedCloseDate: data.expected_close_date,
                    dealType: data.deal_type as DealType,
                    salesperson: data.salesperson,
                    origin: data.origin,
                    technicalResponsible: data.technical_responsible,
                    renewalResponsible: data.renewal_responsible,
                    insuranceType: data.insurance_type,
                    insuranceCompany: data.insurance_company,
                    notes: data.notes || undefined,
                    createdAt: data.created_at.split('T')[0],
                    activities: [],
                };
                setOpportunities(prev => [...prev, newOpportunity]);
                toast.success('Oportunidade criada com sucesso!');
            }
        } catch (error) {
            console.error('Error adding opportunity:', error);
            toast.error('Erro ao criar oportunidade');
        }
    }, []);

    const updateOpportunity = useCallback(async (updatedOpportunity: Opportunity) => {
        try {
            const { error } = await supabase
                .from('opportunities')
                .update({
                    funnel_type: updatedOpportunity.funnelType,
                    stage: updatedOpportunity.stage,
                    title: updatedOpportunity.title,
                    client_id: updatedOpportunity.clientId,
                    value: updatedOpportunity.value,
                    commission: updatedOpportunity.commission,
                    expected_close_date: updatedOpportunity.expectedCloseDate,
                    deal_type: updatedOpportunity.dealType,
                    salesperson: updatedOpportunity.salesperson,
                    origin: updatedOpportunity.origin,
                    technical_responsible: updatedOpportunity.technicalResponsible,
                    renewal_responsible: updatedOpportunity.renewalResponsible,
                    insurance_type: updatedOpportunity.insuranceType,
                    insurance_company: updatedOpportunity.insuranceCompany,
                    notes: updatedOpportunity.notes || null,
                })
                .eq('id', updatedOpportunity.id);

            if (error) throw error;

            setOpportunities(prev => prev.map(o => o.id === updatedOpportunity.id ? updatedOpportunity : o));
            toast.success('Oportunidade atualizada com sucesso!');
        } catch (error) {
            console.error('Error updating opportunity:', error);
            toast.error('Erro ao atualizar oportunidade');
        }
    }, []);

    const deleteOpportunity = useCallback(async (opportunityId: string) => {
        try {
            const { error } = await supabase
                .from('opportunities')
                .delete()
                .eq('id', opportunityId);

            if (error) throw error;

            setOpportunities(prev => prev.filter(o => o.id !== opportunityId));
            toast.success('Oportunidade excluída com sucesso!');
        } catch (error) {
            console.error('Error deleting opportunity:', error);
            toast.error('Erro ao excluir oportunidade');
        }
    }, []);

    const updateOpportunityStage = useCallback(async (opportunityId: string, newStage: string) => {
        try {
            const { error } = await supabase
                .from('opportunities')
                .update({ stage: newStage })
                .eq('id', opportunityId);

            if (error) throw error;

            setOpportunities(prev => prev.map(o => o.id === opportunityId ? { ...o, stage: newStage } : o));
        } catch (error) {
            console.error('Error updating opportunity stage:', error);
            toast.error('Erro ao atualizar estágio da oportunidade');
        }
    }, []);

    // Funnel Activities Management
    const addFunnelActivity = useCallback(async (opportunityId: string, activity: Omit<FunnelActivity, 'id'>) => {
        try {
            const { data, error } = await supabase
                .from('funnel_activities')
                .insert({
                    opportunity_id: opportunityId,
                    text: activity.text,
                    stage: activity.stage,
                    completed: activity.completed,
                    assigned_to: activity.assignedTo,
                    due_date: activity.dueDate || null,
                    due_time: activity.dueTime || null,
                })
                .select()
                .single();

            if (error) throw error;

            if (data) {
                const newActivity: FunnelActivity = {
                    id: data.id,
                    text: data.text,
                    stage: data.stage,
                    completed: data.completed,
                    assignedTo: data.assigned_to,
                    dueDate: data.due_date || undefined,
                    dueTime: data.due_time || undefined,
                };

                setOpportunities(prev => prev.map(o => {
                    if (o.id === opportunityId) {
                        return { ...o, activities: [...o.activities, newActivity] };
                    }
                    return o;
                }));
                toast.success('Atividade adicionada!');
            }
        } catch (error) {
            console.error('Error adding activity:', error);
            toast.error('Erro ao adicionar atividade');
        }
    }, []);

    const updateFunnelActivity = useCallback(async (opportunityId: string, updatedActivity: FunnelActivity) => {
        try {
            const { error } = await supabase
                .from('funnel_activities')
                .update({
                    text: updatedActivity.text,
                    stage: updatedActivity.stage,
                    completed: updatedActivity.completed,
                    assigned_to: updatedActivity.assignedTo,
                    due_date: updatedActivity.dueDate || null,
                    due_time: updatedActivity.dueTime || null,
                })
                .eq('id', updatedActivity.id);

            if (error) throw error;

            setOpportunities(prev => prev.map(o => {
                if (o.id === opportunityId) {
                    return {
                        ...o,
                        activities: o.activities.map(act => act.id === updatedActivity.id ? updatedActivity : act)
                    };
                }
                return o;
            }));
        } catch (error) {
            console.error('Error updating activity:', error);
            toast.error('Erro ao atualizar atividade');
        }
    }, []);

    // Origins Management
    const addOrigin = useCallback(async (origin: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error('Usuário não autenticado');
                return;
            }

            const { error } = await supabase
                .from('origins')
                .insert({ name: origin, user_id: user.id });

            if (error) throw error;

            setOrigins(prev => [...prev, origin]);
            toast.success('Origem adicionada!');
        } catch (error) {
            console.error('Error adding origin:', error);
            toast.error('Erro ao adicionar origem');
        }
    }, []);

    const deleteOrigin = useCallback(async (origin: string) => {
        try {
            const { error } = await supabase
                .from('origins')
                .delete()
                .eq('name', origin);

            if (error) throw error;

            setOrigins(prev => prev.filter(o => o !== origin));
            toast.success('Origem removida!');
        } catch (error) {
            console.error('Error deleting origin:', error);
            toast.error('Erro ao remover origem');
        }
    }, []);

    return {
        opportunities,
        setOpportunities,
        origins,
        setOrigins,
        addOpportunity,
        updateOpportunity,
        deleteOpportunity,
        updateOpportunityStage,
        addFunnelActivity,
        updateFunnelActivity,
        addOrigin,
        deleteOrigin
    };
};
