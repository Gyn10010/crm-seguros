import React, { useState, useEffect } from 'react';
import { ActivityTemplate } from '../types/index';
import { Button } from './ui/button';
import { CloseIcon, EditIcon, TrashIcon } from './icons/Icons';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface JobRole {
    id: string;
    name: string;
}

const ActivityTemplates: React.FC = () => {
    const [templates, setTemplates] = useState<ActivityTemplate[]>([]);
    const [jobRoles, setJobRoles] = useState<JobRole[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<ActivityTemplate | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        responsibleType: '',
        maxHours: 24,
    });

    useEffect(() => {
        loadTemplates();
        loadJobRoles();
    }, []);

    const loadTemplates = async () => {
        const { data, error } = await supabase
            .from('activity_templates')
            .select('*')
            .eq('is_active', true)
            .order('order_index', { ascending: true });

        if (data && !error) {
            setTemplates(data.map(t => ({
                id: t.id,
                name: t.name,
                responsibleType: t.responsible_type as 'salesperson' | 'technical' | 'renewal' | 'any',
                maxHours: t.max_hours,
                isActive: t.is_active,
                orderIndex: t.order_index,
            })));
        }
    };

    const loadJobRoles = async () => {
        const { data, error } = await supabase
            .from('job_roles')
            .select('id, name')
            .eq('is_active', true)
            .order('order_index', { ascending: true });

        if (data && !error) {
            setJobRoles(data);
            if (data.length > 0 && !formData.responsibleType) {
                setFormData(prev => ({ ...prev, responsibleType: data[0].name }));
            }
        }
    };

    const handleOpenModal = (template: ActivityTemplate | null = null) => {
        if (template) {
            setEditingTemplate(template);
            setFormData({
                name: template.name,
                responsibleType: template.responsibleType,
                maxHours: template.maxHours,
            });
        } else {
            setEditingTemplate(null);
            setFormData({
                name: '',
                responsibleType: jobRoles.length > 0 ? jobRoles[0].name : '',
                maxHours: 24,
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingTemplate(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (editingTemplate) {
            const { error } = await supabase
                .from('activity_templates')
                .update({
                    name: formData.name,
                    responsible_type: formData.responsibleType,
                    max_hours: formData.maxHours,
                })
                .eq('id', editingTemplate.id);

            if (error) {
                toast.error('Erro ao atualizar template: ' + error.message);
            } else {
                toast.success('Template atualizado com sucesso!');
                loadTemplates();
                handleCloseModal();
            }
        } else {
            const { error } = await supabase
                .from('activity_templates')
                .insert({
                    name: formData.name,
                    responsible_type: formData.responsibleType,
                    max_hours: formData.maxHours,
                    order_index: templates.length,
                });

            if (error) {
                toast.error('Erro ao criar template: ' + error.message);
            } else {
                toast.success('Template criado com sucesso!');
                loadTemplates();
                handleCloseModal();
            }
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este template?')) return;

        const { error } = await supabase
            .from('activity_templates')
            .update({ is_active: false })
            .eq('id', id);

        if (error) {
            toast.error('Erro ao excluir template: ' + error.message);
        } else {
            toast.success('Template excluído com sucesso!');
            loadTemplates();
        }
    };


    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-text-primary">Atividades Padrão</h3>
                <Button onClick={() => handleOpenModal()} className="bg-blue-600 hover:bg-blue-700 text-white">
                    + Adicionar Template
                </Button>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full bg-ui-card">
                    <thead className="bg-ui-background">
                        <tr>
                            <th className="py-3 px-4 text-left text-xs font-medium text-text-secondary uppercase">Nome</th>
                            <th className="py-3 px-4 text-left text-xs font-medium text-text-secondary uppercase">Tipo de Responsável</th>
                            <th className="py-3 px-4 text-left text-xs font-medium text-text-secondary uppercase">Prazo Máximo (horas)</th>
                            <th className="py-3 px-4 text-left text-xs font-medium text-text-secondary uppercase">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-ui-border">
                        {templates.map(template => (
                            <tr key={template.id}>
                                <td className="py-3 px-4 text-sm text-text-primary">{template.name}</td>
                                <td className="py-3 px-4 text-sm text-text-secondary">
                                    {template.responsibleType}
                                </td>
                                <td className="py-3 px-4 text-sm text-text-secondary">{template.maxHours}h</td>
                                <td className="py-3 px-4 text-sm">
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => handleOpenModal(template)}
                                            className="text-text-secondary hover:text-brand-primary transition-colors"
                                        >
                                            <EditIcon />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(template.id)}
                                            className="text-text-secondary hover:text-danger transition-colors"
                                        >
                                            <TrashIcon />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-ui-card p-8 rounded-lg border border-ui-border w-full max-w-md relative shadow-2xl">
                        <h2 className="text-2xl font-bold text-text-primary mb-6">
                            {editingTemplate ? 'Editar Template' : 'Novo Template'}
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
                                <label htmlFor="name" className="block text-sm font-medium text-text-secondary mb-1">
                                    Nome da Atividade
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                                    {editingTemplate ? 'Salvar' : 'Criar'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ActivityTemplates;
