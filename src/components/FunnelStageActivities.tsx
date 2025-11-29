import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { CloseIcon, EditIcon, TrashIcon } from './icons/Icons';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FunnelStageActivity {
    id: string;
    funnelType: string;
    stage: string;
    activityText: string;
    orderIndex: number;
    maxHours: number;
    responsibleType: string;
}

interface FunnelConfig {
    id: string;
    funnelName: string;
    funnelKey: string;
}

interface FunnelStageConfig {
    id: string;
    funnelKey: string;
    stageName: string;
    stageKey: string;
}

interface JobRole {
    id: string;
    name: string;
}

const FunnelStageActivities: React.FC = () => {
    const [activities, setActivities] = useState<FunnelStageActivity[]>([]);
    const [funnelConfigs, setFunnelConfigs] = useState<FunnelConfig[]>([]);
    const [funnelStages, setFunnelStages] = useState<FunnelStageConfig[]>([]);
    const [jobRoles, setJobRoles] = useState<JobRole[]>([]);
    const [selectedFunnel, setSelectedFunnel] = useState('');
    const [selectedStage, setSelectedStage] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingActivity, setEditingActivity] = useState<FunnelStageActivity | null>(null);
    const [formData, setFormData] = useState({
        activityText: '',
        maxHours: 24,
        responsibleType: '',
    });

    useEffect(() => {
        loadFunnelConfigs();
        loadJobRoles();
    }, []);

    useEffect(() => {
        if (selectedFunnel && funnelConfigs.length > 0) {
            loadFunnelStages(selectedFunnel);
        }
    }, [selectedFunnel, funnelConfigs]);

    useEffect(() => {
        if (selectedFunnel && selectedStage && funnelConfigs.length > 0) {
            loadActivities();
        }
    }, [selectedFunnel, selectedStage, funnelConfigs]);

    const loadFunnelConfigs = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from('funnel_configurations')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .order('order_index', { ascending: true });

        if (data) {
            setFunnelConfigs(data.map(f => ({
                id: f.id,
                funnelName: f.funnel_name,
                funnelKey: f.funnel_key,
            })));
            if (data.length > 0) {
                setSelectedFunnel(data[0].funnel_name);
            }
        }
    };

    const loadFunnelStages = async (funnelName: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const funnelConfig = funnelConfigs.find(f => f.funnelName === funnelName);
        if (!funnelConfig) return;

        const { data } = await supabase
            .from('funnel_stages')
            .select('*')
            .eq('user_id', user.id)
            .eq('funnel_key', funnelConfig.funnelKey)
            .order('order_index', { ascending: true });

        if (data) {
            setFunnelStages(data.map(s => ({
                id: s.id,
                funnelKey: s.funnel_key,
                stageName: s.stage_name,
                stageKey: s.stage_key,
            })));
            if (data.length > 0) {
                setSelectedStage(data[0].stage_name);
            }
        }
    };

    const loadJobRoles = async () => {
        const { data } = await supabase
            .from('job_roles')
            .select('id, name')
            .eq('is_active', true)
            .order('order_index', { ascending: true });

        if (data) {
            setJobRoles(data);
            if (data.length > 0 && !formData.responsibleType) {
                setFormData(prev => ({ ...prev, responsibleType: data[0].name }));
            }
        }
    };

    const loadActivities = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const funnelConfig = funnelConfigs.find(f => f.funnelName === selectedFunnel);
        if (!funnelConfig) return;

        const { data } = await supabase
            .from('funnel_activity_templates')
            .select('*')
            .eq('user_id', user.id)
            .eq('funnel_type', funnelConfig.funnelName)
            .eq('stage', selectedStage)
            .order('order_index', { ascending: true });

        if (data) {
            setActivities(data.map(a => ({
                id: a.id,
                funnelType: a.funnel_type,
                stage: a.stage,
                activityText: a.activity_text,
                orderIndex: a.order_index,
                maxHours: a.max_hours || 24,
                responsibleType: a.responsible_type || 'any',
            })));
        }
    };

    const handleOpenModal = (activity: FunnelStageActivity | null = null) => {
        if (activity) {
            setEditingActivity(activity);
            setFormData({
                activityText: activity.activityText,
                maxHours: activity.maxHours,
                responsibleType: activity.responsibleType,
            });
        } else {
            setEditingActivity(null);
            setFormData({
                activityText: '',
                maxHours: 24,
                responsibleType: jobRoles.length > 0 ? jobRoles[0].name : '',
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingActivity(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const funnelConfig = funnelConfigs.find(f => f.funnelName === selectedFunnel);
        if (!funnelConfig) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        if (editingActivity) {
            const { error } = await supabase
                .from('funnel_activity_templates')
                .update({
                    activity_text: formData.activityText,
                    max_hours: formData.maxHours,
                    responsible_type: formData.responsibleType,
                })
                .eq('id', editingActivity.id);

            if (error) {
                toast.error('Erro ao atualizar atividade: ' + error.message);
            } else {
                toast.success('Atividade atualizada com sucesso!');
                loadActivities();
                handleCloseModal();
            }
        } else {
            const { error } = await supabase
                .from('funnel_activity_templates')
                .insert({
                    user_id: user.id,
                    funnel_type: funnelConfig.funnelName,
                    stage: selectedStage,
                    activity_text: formData.activityText,
                    max_hours: formData.maxHours,
                    responsible_type: formData.responsibleType,
                    order_index: activities.length,
                });

            if (error) {
                toast.error('Erro ao criar atividade: ' + error.message);
            } else {
                toast.success('Atividade criada com sucesso!');
                loadActivities();
                handleCloseModal();
            }
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta atividade?')) return;

        const { error } = await supabase
            .from('funnel_activity_templates')
            .delete()
            .eq('id', id);

        if (error) {
            toast.error('Erro ao excluir atividade: ' + error.message);
        } else {
            toast.success('Atividade excluída com sucesso!');
            loadActivities();
        }
    };

    const funnelConfig = funnelConfigs.find(f => f.funnelName === selectedFunnel);
    const filteredStages = funnelStages.filter(s => funnelConfig && s.funnelKey === funnelConfig.funnelKey);

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-text-primary mb-4">Atividades Padrão dos Funis</h3>
                <p className="text-sm text-text-secondary mb-6">
                    Configure as atividades padrão que serão criadas automaticamente para cada estágio dos funis de vendas.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">Tipo de Funil</label>
                    <select
                        value={selectedFunnel}
                        onChange={(e) => setSelectedFunnel(e.target.value)}
                        className="w-full px-3 py-2 border border-ui-border bg-white rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    >
                        {funnelConfigs.map(f => (
                            <option key={f.id} value={f.funnelName}>{f.funnelName}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">Estágio</label>
                    <select
                        value={selectedStage}
                        onChange={(e) => setSelectedStage(e.target.value)}
                        className="w-full px-3 py-2 border border-ui-border bg-white rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    >
                        {filteredStages.map(s => (
                            <option key={s.id} value={s.stageName}>{s.stageName}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="border-t border-ui-border pt-6">
                <div className="flex justify-between items-center mb-4">
                    <h4 className="text-md font-semibold text-text-primary">
                        Atividades para: {selectedFunnel} - {selectedStage}
                    </h4>
                    <Button onClick={() => handleOpenModal()} className="bg-blue-600 hover:bg-blue-700 text-white">
                        + Nova Atividade
                    </Button>
                </div>

                {activities.length === 0 ? (
                    <div className="text-center py-12 bg-ui-background rounded-lg">
                        <p className="text-text-muted">Nenhuma atividade configurada para este estágio.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {activities.map((activity, index) => (
                            <div key={activity.id} className="p-4 bg-ui-card rounded-lg border border-ui-border">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-start gap-3 flex-1">
                                        <span className="text-sm font-medium text-text-muted mt-1">#{index + 1}</span>
                                        <div className="flex-1">
                                            <p className="text-base font-medium text-text-primary mb-2">{activity.activityText}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleOpenModal(activity)}
                                            className="p-2 text-text-secondary hover:text-brand-primary transition-colors rounded-md hover:bg-ui-background"
                                            title="Editar atividade"
                                        >
                                            <EditIcon />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(activity.id)}
                                            className="p-2 text-text-secondary hover:text-danger transition-colors rounded-md hover:bg-ui-background"
                                            title="Excluir atividade"
                                        >
                                            <TrashIcon />
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-ui-border">
                                    <div>
                                        <p className="text-xs text-text-muted mb-1">Prazo Máximo</p>
                                        <p className="text-sm font-medium text-text-primary">{activity.maxHours} horas</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-text-muted mb-1">Responsável Sugerido</p>
                                        <p className="text-sm font-medium text-text-primary">{activity.responsibleType}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-ui-card p-8 rounded-lg border border-ui-border w-full max-w-md relative shadow-2xl">
                        <h2 className="text-2xl font-bold text-text-primary mb-6">
                            {editingActivity ? 'Editar Atividade' : 'Nova Atividade'}
                        </h2>
                        <button
                            type="button"
                            onClick={handleCloseModal}
                            className="absolute top-4 right-4 text-text-secondary hover:text-text-primary transition-colors"
                        >
                            <CloseIcon />
                        </button>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="activityText" className="block text-sm font-medium text-text-secondary mb-1">
                                    Descrição da Atividade
                                </label>
                                <input
                                    type="text"
                                    id="activityText"
                                    value={formData.activityText}
                                    onChange={(e) => setFormData({ ...formData, activityText: e.target.value })}
                                    required
                                    className="w-full px-3 py-2 border border-ui-border bg-white rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
                                />
                            </div>

                            <div>
                                <label htmlFor="responsibleType" className="block text-sm font-medium text-text-secondary mb-1">
                                    Cargo Responsável Sugerido
                                </label>
                                <select
                                    id="responsibleType"
                                    value={formData.responsibleType}
                                    onChange={(e) => setFormData({ ...formData, responsibleType: e.target.value })}
                                    required
                                    className="w-full px-3 py-2 border border-ui-border bg-white rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
                                >
                                    {jobRoles.map(role => (
                                        <option key={role.id} value={role.name}>{role.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label htmlFor="maxHours" className="block text-sm font-medium text-text-secondary mb-1">
                                    Prazo Máximo (horas)
                                </label>
                                <input
                                    type="number"
                                    id="maxHours"
                                    value={formData.maxHours}
                                    onChange={(e) => setFormData({ ...formData, maxHours: parseInt(e.target.value) || 24 })}
                                    required
                                    min="1"
                                    className="w-full px-3 py-2 border border-ui-border bg-white rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
                                />
                            </div>

                            <div className="flex justify-end gap-4 pt-4 mt-6 border-t border-ui-border">
                                <Button type="button" variant="outline" onClick={handleCloseModal}>
                                    Cancelar
                                </Button>
                                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                                    {editingActivity ? 'Salvar' : 'Criar'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FunnelStageActivities;
