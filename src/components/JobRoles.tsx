import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { CloseIcon, EditIcon, TrashIcon } from './icons/Icons';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface JobRole {
    id: string;
    name: string;
    orderIndex: number;
    isActive: boolean;
}

const JobRoles: React.FC = () => {
    const [roles, setRoles] = useState<JobRole[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<JobRole | null>(null);
    const [formData, setFormData] = useState({ name: '' });

    useEffect(() => {
        loadRoles();
    }, []);

    const loadRoles = async () => {
        const { data, error } = await supabase
            .from('job_roles')
            .select('*')
            .eq('is_active', true)
            .order('order_index', { ascending: true });

        if (data && !error) {
            setRoles(data.map(r => ({
                id: r.id,
                name: r.name,
                orderIndex: r.order_index,
                isActive: r.is_active,
            })));
        }
    };

    const handleOpenModal = (role: JobRole | null = null) => {
        if (role) {
            setEditingRole(role);
            setFormData({ name: role.name });
        } else {
            setEditingRole(null);
            setFormData({ name: '' });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingRole(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (editingRole) {
            const { error } = await supabase
                .from('job_roles')
                .update({ name: formData.name })
                .eq('id', editingRole.id);

            if (error) {
                toast.error('Erro ao atualizar cargo: ' + error.message);
            } else {
                toast.success('Cargo atualizado com sucesso!');
                loadRoles();
                handleCloseModal();
            }
        } else {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error('Usuário não autenticado');
                return;
            }

            const { error } = await supabase
                .from('job_roles')
                .insert([{
                    name: formData.name,
                    order_index: roles.length,
                    user_id: user.id,
                }]);

            if (error) {
                toast.error('Erro ao criar cargo: ' + error.message);
            } else {
                toast.success('Cargo criado com sucesso!');
                loadRoles();
                handleCloseModal();
            }
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este cargo?')) return;

        const { error } = await supabase
            .from('job_roles')
            .update({ is_active: false })
            .eq('id', id);

        if (error) {
            toast.error('Erro ao excluir cargo: ' + error.message);
        } else {
            toast.success('Cargo excluído com sucesso!');
            loadRoles();
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-text-primary">Cargos</h3>
                <Button onClick={() => handleOpenModal()} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    + Adicionar Cargo
                </Button>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full bg-ui-card">
                    <thead className="bg-ui-background">
                        <tr>
                            <th className="py-3 px-4 text-left text-xs font-medium text-text-secondary uppercase">Nome do Cargo</th>
                            <th className="py-3 px-4 text-left text-xs font-medium text-text-secondary uppercase">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-ui-border">
                        {roles.map(role => (
                            <tr key={role.id}>
                                <td className="py-3 px-4 text-sm text-text-primary">{role.name}</td>
                                <td className="py-3 px-4 text-sm">
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => handleOpenModal(role)}
                                            className="text-text-secondary hover:text-brand-primary transition-colors"
                                        >
                                            <EditIcon />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(role.id)}
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
                            {editingRole ? 'Editar Cargo' : 'Novo Cargo'}
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
                                    Nome do Cargo
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ name: e.target.value })}
                                    required
                                    className="w-full px-3 py-2 border border-ui-border bg-white rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
                                />
                            </div>

                            <div className="flex justify-end gap-4 pt-4 mt-6 border-t border-ui-border">
                                <Button type="button" variant="outline" onClick={handleCloseModal}>
                                    Cancelar
                                </Button>
                                <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                                    {editingRole ? 'Salvar' : 'Criar'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default JobRoles;
