import { useState, useCallback } from 'react';
import { FunnelConfiguration, FunnelStage, FunnelActivityTemplate } from '../types/index';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useFunnels = () => {
    const [funnelConfigurations, setFunnelConfigurations] = useState<FunnelConfiguration[]>([]);
    const [funnelStages, setFunnelStages] = useState<FunnelStage[]>([]);
    const [funnelActivityTemplates, setFunnelActivityTemplates] = useState<FunnelActivityTemplate[]>([]);

    // Funnel Configuration Management
    const addFunnelConfiguration = useCallback(async (funnelName: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error('Usuário não autenticado');
                return;
            }

            const maxOrder = funnelConfigurations.length > 0
                ? Math.max(...funnelConfigurations.map(f => f.orderIndex))
                : -1;

            const funnelKey = funnelName.toLowerCase().replace(/\s+/g, '_');
            const newFunnel = {
                funnel_name: funnelName,
                funnel_key: funnelKey,
                is_active: true,
                order_index: maxOrder + 1,
                user_id: user.id
            };

            const { data, error } = await supabase
                .from('funnel_configurations')
                .insert(newFunnel)
                .select()
                .single();

            if (error) throw error;

            if (data) {
                setFunnelConfigurations(prev => [...prev, {
                    id: data.id,
                    funnelName: data.funnel_name,
                    funnelKey: data.funnel_key,
                    isActive: data.is_active,
                    orderIndex: data.order_index,
                }]);
                toast.success('Funil criado com sucesso!');
            }
        } catch (error) {
            console.error('Error adding funnel:', error);
            toast.error('Erro ao criar funil');
        }
    }, [funnelConfigurations]);

    const updateFunnelConfiguration = useCallback(async (updatedFunnel: FunnelConfiguration) => {
        try {
            const { error } = await supabase
                .from('funnel_configurations')
                .update({
                    funnel_name: updatedFunnel.funnelName,
                    is_active: updatedFunnel.isActive,
                    order_index: updatedFunnel.orderIndex
                })
                .eq('id', updatedFunnel.id);

            if (error) throw error;

            setFunnelConfigurations(prev =>
                prev.map(f => f.id === updatedFunnel.id ? updatedFunnel : f)
            );
            toast.success('Funil atualizado com sucesso!');
        } catch (error) {
            console.error('Error updating funnel:', error);
            toast.error('Erro ao atualizar funil');
        }
    }, []);

    const deleteFunnelConfiguration = useCallback(async (funnelId: string) => {
        try {
            const funnel = funnelConfigurations.find(f => f.id === funnelId);
            if (!funnel) return;

            const { error } = await supabase
                .from('funnel_configurations')
                .delete()
                .eq('id', funnelId);

            if (error) throw error;

            // Delete related stages and templates locally (Supabase cascade handles DB)
            setFunnelStages(prev => prev.filter(s => s.funnelKey !== funnel.funnelKey));
            setFunnelActivityTemplates(prev => prev.filter(t => t.funnelType !== funnel.funnelKey));

            setFunnelConfigurations(prev => {
                const filtered = prev.filter(f => f.id !== funnelId);
                return filtered.map((f, idx) => ({ ...f, orderIndex: idx }));
            });
            toast.success('Funil excluído com sucesso!');
        } catch (error) {
            console.error('Error deleting funnel:', error);
            toast.error('Erro ao excluir funil');
        }
    }, [funnelConfigurations]);

    const moveFunnelConfiguration = useCallback(async (funnelId: string, direction: 'up' | 'down') => {
        const sorted = [...funnelConfigurations].sort((a, b) => a.orderIndex - b.orderIndex);
        const currentIndex = sorted.findIndex(f => f.id === funnelId);

        if (
            (direction === 'up' && currentIndex === 0) ||
            (direction === 'down' && currentIndex === sorted.length - 1)
        ) {
            return;
        }

        const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        const current = sorted[currentIndex];
        const swapWith = sorted[swapIndex];

        // Optimistic update
        const newConfigurations = funnelConfigurations.map(f => {
            if (f.id === current.id) return { ...f, orderIndex: swapWith.orderIndex };
            if (f.id === swapWith.id) return { ...f, orderIndex: current.orderIndex };
            return f;
        });

        setFunnelConfigurations(newConfigurations);

        try {
            // Update both records in DB
            const { error: error1 } = await supabase
                .from('funnel_configurations')
                .update({ order_index: swapWith.orderIndex })
                .eq('id', current.id);

            if (error1) throw error1;

            const { error: error2 } = await supabase
                .from('funnel_configurations')
                .update({ order_index: current.orderIndex })
                .eq('id', swapWith.id);

            if (error2) throw error2;

        } catch (error) {
            console.error('Error moving funnel:', error);
            toast.error('Erro ao reordenar funis');
            // Revert on error
            setFunnelConfigurations(funnelConfigurations);
        }
    }, [funnelConfigurations]);

    // Funnel Stage Management
    const addFunnelStage = useCallback(async (funnelKey: string, stageName: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error('Usuário não autenticado');
                return;
            }

            const existingStages = funnelStages.filter(s => s.funnelKey === funnelKey);
            const maxOrder = existingStages.length > 0
                ? Math.max(...existingStages.map(s => s.orderIndex))
                : -1;

            const stageKey = stageName.toLowerCase().replace(/\s+/g, '_');
            const newStage = {
                funnel_key: funnelKey,
                stage_name: stageName,
                stage_key: stageKey,
                order_index: maxOrder + 1,
                user_id: user.id
            };

            const { data, error } = await supabase
                .from('funnel_stages')
                .insert(newStage)
                .select()
                .single();

            if (error) throw error;

            if (data) {
                setFunnelStages(prev => [...prev, {
                    id: data.id,
                    funnelKey: data.funnel_key,
                    stageName: data.stage_name,
                    stageKey: data.stage_key,
                    orderIndex: data.order_index,
                }]);
                toast.success('Estágio adicionado com sucesso!');
            }
        } catch (error) {
            console.error('Error adding stage:', error);
            toast.error('Erro ao adicionar estágio');
        }
    }, [funnelStages]);

    const updateFunnelStage = useCallback(async (updatedStage: FunnelStage) => {
        try {
            const { error } = await supabase
                .from('funnel_stages')
                .update({
                    stage_name: updatedStage.stageName,
                })
                .eq('id', updatedStage.id);

            if (error) throw error;

            setFunnelStages(prev =>
                prev.map(s => s.id === updatedStage.id ? updatedStage : s)
            );
            toast.success('Estágio atualizado com sucesso!');
        } catch (error) {
            console.error('Error updating stage:', error);
            toast.error('Erro ao atualizar estágio');
        }
    }, []);

    const deleteFunnelStage = useCallback(async (stageId: string) => {
        try {
            const stage = funnelStages.find(s => s.id === stageId);
            if (!stage) return;

            const { error } = await supabase
                .from('funnel_stages')
                .delete()
                .eq('id', stageId);

            if (error) throw error;

            // Delete related templates locally
            setFunnelActivityTemplates(prev =>
                prev.filter(t => !(t.funnelType === stage.funnelKey && t.stage === stage.stageKey))
            );

            setFunnelStages(prev => {
                const filtered = prev.filter(s => s.id !== stageId);
                return filtered;
            });
            toast.success('Estágio excluído com sucesso!');
        } catch (error) {
            console.error('Error deleting stage:', error);
            toast.error('Erro ao excluir estágio');
        }
    }, [funnelStages]);

    const moveFunnelStage = useCallback(async (stageId: string, direction: 'up' | 'down') => {
        const stage = funnelStages.find(s => s.id === stageId);
        if (!stage) return;

        const sameGroup = funnelStages.filter(s => s.funnelKey === stage.funnelKey)
            .sort((a, b) => a.orderIndex - b.orderIndex);

        const currentIndex = sameGroup.findIndex(s => s.id === stageId);
        if (
            (direction === 'up' && currentIndex === 0) ||
            (direction === 'down' && currentIndex === sameGroup.length - 1)
        ) {
            return;
        }

        const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        const swapWith = sameGroup[swapIndex];

        // Optimistic update
        const newStages = funnelStages.map(s => {
            if (s.id === stage.id) return { ...s, orderIndex: swapWith.orderIndex };
            if (s.id === swapWith.id) return { ...s, orderIndex: stage.orderIndex };
            return s;
        });

        setFunnelStages(newStages);

        try {
            // Update both records in DB
            const { error: error1 } = await supabase
                .from('funnel_stages')
                .update({ order_index: swapWith.orderIndex })
                .eq('id', stage.id);

            if (error1) throw error1;

            const { error: error2 } = await supabase
                .from('funnel_stages')
                .update({ order_index: stage.orderIndex })
                .eq('id', swapWith.id);

            if (error2) throw error2;

        } catch (error) {
            console.error('Error moving stage:', error);
            toast.error('Erro ao reordenar estágios');
            setFunnelStages(funnelStages); // Revert
        }
    }, [funnelStages]);

    // Activity Templates Management
    const addFunnelActivityTemplate = useCallback((templateData: Omit<FunnelActivityTemplate, 'id' | 'orderIndex'>) => {
        const existingTemplates = funnelActivityTemplates.filter(
            t => t.funnelType === templateData.funnelType && t.stage === templateData.stage
        );
        const maxOrder = existingTemplates.length > 0
            ? Math.max(...existingTemplates.map(t => t.orderIndex))
            : -1;

        const newTemplate: FunnelActivityTemplate = {
            ...templateData,
            id: `tpl-${Date.now()}`,
            orderIndex: maxOrder + 1,
        };
        setFunnelActivityTemplates(prev => [...prev, newTemplate]);
    }, [funnelActivityTemplates]);

    const updateFunnelActivityTemplate = useCallback((updatedTemplate: FunnelActivityTemplate) => {
        setFunnelActivityTemplates(prev =>
            prev.map(t => t.id === updatedTemplate.id ? updatedTemplate : t)
        );
    }, []);

    const deleteFunnelActivityTemplate = useCallback((templateId: string) => {
        setFunnelActivityTemplates(prev => {
            const templateToDelete = prev.find(t => t.id === templateId);
            if (!templateToDelete) return prev;

            const filtered = prev.filter(t => t.id !== templateId);

            // Reorder remaining templates in the same funnel/stage
            return filtered.map(t => {
                if (t.funnelType === templateToDelete.funnelType &&
                    t.stage === templateToDelete.stage &&
                    t.orderIndex > templateToDelete.orderIndex) {
                    return { ...t, orderIndex: t.orderIndex - 1 };
                }
                return t;
            });
        });
    }, []);

    const moveFunnelActivityTemplate = useCallback((templateId: string, direction: 'up' | 'down') => {
        setFunnelActivityTemplates(prev => {
            const template = prev.find(t => t.id === templateId);
            if (!template) return prev;

            const sameGroup = prev.filter(
                t => t.funnelType === template.funnelType && t.stage === template.stage
            ).sort((a, b) => a.orderIndex - b.orderIndex);

            const currentIndex = sameGroup.findIndex(t => t.id === templateId);
            if (
                (direction === 'up' && currentIndex === 0) ||
                (direction === 'down' && currentIndex === sameGroup.length - 1)
            ) {
                return prev;
            }

            const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
            const swapWith = sameGroup[swapIndex];

            return prev.map(t => {
                if (t.id === templateId) {
                    return { ...t, orderIndex: swapWith.orderIndex };
                }
                if (t.id === swapWith.id) {
                    return { ...t, orderIndex: template.orderIndex };
                }
                return t;
            });
        });
    }, []);

    return {
        funnelConfigurations,
        setFunnelConfigurations,
        funnelStages,
        setFunnelStages,
        funnelActivityTemplates,
        setFunnelActivityTemplates,
        addFunnelConfiguration,
        updateFunnelConfiguration,
        deleteFunnelConfiguration,
        moveFunnelConfiguration,
        addFunnelStage,
        updateFunnelStage,
        deleteFunnelStage,
        moveFunnelStage,
        addFunnelActivityTemplate,
        updateFunnelActivityTemplate,
        deleteFunnelActivityTemplate,
        moveFunnelActivityTemplate
    };
};
