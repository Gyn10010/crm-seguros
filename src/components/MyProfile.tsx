import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';

const MyProfile: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profileData, setProfileData] = useState({
        name: '',
        email: '',
        role: '',
        avatar_url: '',
    });
    const [jobRoles, setJobRoles] = useState<string[]>([]);

    useEffect(() => {
        loadProfile();
        loadJobRoles();
    }, []);

    const loadProfile = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error) throw error;

            setProfileData({
                name: data.name || '',
                email: data.email || '',
                role: data.role || '',
                avatar_url: data.avatar_url || '',
            });
        } catch (error) {
            console.error('Error loading profile:', error);
            toast.error('Erro ao carregar perfil');
        } finally {
            setLoading(false);
        }
    };

    const loadJobRoles = async () => {
        try {
            const { data, error } = await supabase
                .from('job_roles')
                .select('name')
                .eq('is_active', true)
                .order('order_index', { ascending: true });

            if (error) throw error;
            setJobRoles(data?.map(r => r.name) || ['Gestor', 'Vendedor']);
        } catch (error) {
            console.error('Error loading job roles:', error);
            // Fallback to default roles
            setJobRoles(['Gestor', 'Vendedor']);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setProfileData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Usuário não autenticado');

            const { error } = await supabase
                .from('profiles')
                .update({
                    name: profileData.name,
                    role: profileData.role,
                })
                .eq('id', user.id);

            if (error) throw error;

            toast.success('Perfil atualizado com sucesso! Recarregue a página para ver as mudanças.');
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error(error instanceof Error ? error.message : 'Erro ao atualizar perfil');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="text-text-secondary">Carregando...</div>;
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
            <div>
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                    id="name"
                    name="name"
                    type="text"
                    value={profileData.name}
                    onChange={handleChange}
                    required
                    className="mt-1"
                />
            </div>

            <div>
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    name="email"
                    type="email"
                    value={profileData.email}
                    disabled
                    className="mt-1 bg-ui-background cursor-not-allowed"
                />
                <p className="text-xs text-text-muted mt-1">O email não pode ser alterado</p>
            </div>

            <div>
                <Label htmlFor="role">Cargo</Label>
                <select
                    id="role"
                    name="role"
                    value={profileData.role}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-ui-border bg-white rounded-md shadow-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                >
                    {jobRoles.map(role => (
                        <option key={role} value={role}>{role}</option>
                    ))}
                </select>
                <p className="text-xs text-text-muted mt-1">Este cargo será exibido no cabeçalho do sistema</p>
            </div>

            <div className="flex justify-end pt-4">
                <Button type="submit" disabled={saving}>
                    {saving ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
            </div>
        </form>
    );
};

export default MyProfile;
