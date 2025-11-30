/**
 * SECURITY NOTE - User Roles Architecture:
 * 
 * This application uses TWO separate role fields:
 * 1. profiles.role (text: 'Gestor', 'Vendedor') - DISPLAY ONLY for job titles
 * 2. user_roles.role (enum: 'admin', 'user') - AUTHORITATIVE for all security checks
 * 
 * ⚠️ CRITICAL: NEVER use profiles.role for authorization decisions!
 * ✅ ALWAYS use user_roles table via has_role() function for security
 * 
 * All RLS policies and admin checks correctly use user_roles.role
 */

import React, { useState, useEffect, useRef } from 'react';
import { LDRState } from '../hooks/useLDRState';
import { User, Page } from '../types/index';
import { CloseIcon, TrashIcon, EditIcon } from './icons/Icons';
import FunnelTemplates from './FunnelTemplates';
import FunnelConfigurationComponent from './FunnelConfiguration';
import UserManagement from './UserManagement';
import ActivityTemplates from './ActivityTemplates';
import JobRoles from './JobRoles';
import { ImportCSV } from './ImportCSV';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from './ui/button';

interface SettingsProps {
    ldrState: LDRState;
    isAdmin?: boolean;
}

const getInitials = (name: string) => {
    if (!name) return '';
    const names = name.split(' ');
    if (names.length > 1 && names[1]) {
        return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};

const AccordionSection: React.FC<{ title: string; children: React.ReactNode; isOpen: boolean; onToggle: () => void; }> = ({ title, children, isOpen, onToggle }) => {
    return (
        <div className="border border-ui-border rounded-lg bg-ui-card shadow-sm">
            <button
                onClick={onToggle}
                className="w-full flex justify-between items-center p-4 text-left font-bold text-text-primary"
            >
                <span>{title}</span>
                <svg className={`w-5 h-5 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
            {isOpen && (
                <div className="p-6 border-t border-ui-border">
                    {children}
                </div>
            )}
        </div>
    );
};

const GeneralSettings: React.FC<{ ldrState: LDRState }> = ({ ldrState }) => {
    const { systemSettings, updateSystemSettings } = ldrState;

    const handleSettingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        updateSystemSettings({ [name]: value });
    };

    return (
        <div className="space-y-4">
            <div>
                <label htmlFor="companyName" className="block text-sm font-medium text-text-secondary mb-1">Nome da Empresa</label>
                <input type="text" name="companyName" id="companyName" value={systemSettings.companyName} onChange={handleSettingChange} className="mt-1 block w-full px-3 py-2 bg-white border border-ui-border rounded-md shadow-sm text-text-primary" />
            </div>
            <div className="flex items-center gap-4">
                <label htmlFor="themeColor" className="block text-sm font-medium text-text-secondary">Cor do Tema</label>
                <input type="color" name="themeColor" id="themeColor" value={systemSettings.themeColor} onChange={handleSettingChange} className="h-10 w-10" />
            </div>
        </div>
    );
};

const ListManagement: React.FC<{ title: string; items: string[]; onAdd: (item: string) => void; onDelete: (item: string) => void; placeholder: string; }> = ({ title, items, onAdd, onDelete, placeholder }) => {
    const [newItem, setNewItem] = useState('');

    const handleAddItem = () => {
        if (newItem.trim()) {
            onAdd(newItem.trim());
            setNewItem('');
        }
    };

    return (
        <div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
            <div className="flex gap-2 mb-4">
                <input
                    type="text"
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    placeholder={placeholder}
                    className="flex-grow p-2 bg-white border border-ui-border rounded-md text-text-primary"
                />
                <Button onClick={handleAddItem} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                    Adicionar
                </Button>
            </div>
            <div className="flex flex-wrap gap-2">
                {items.map(item => (
                    <div key={item} className="bg-ui-hover text-text-secondary text-sm font-medium px-3 py-1 rounded-full flex items-center gap-2">
                        {item}
                        <button onClick={() => onDelete(item)} className="text-text-muted hover:text-danger">&times;</button>
                    </div>
                ))}
            </div>
        </div>
    );
};

const AlertSettings: React.FC<{ ldrState: LDRState }> = ({ ldrState }) => {
    const { systemSettings, updateSystemSettings } = ldrState;

    return (
        <div className="space-y-4">
            <div>
                <label htmlFor="renewalAlertDays" className="block text-sm font-medium text-text-secondary mb-1">Alerta de Renovação (dias de antecedência)</label>
                <input type="number" name="renewalAlertDays" id="renewalAlertDays" value={systemSettings.renewalAlertDays} onChange={e => updateSystemSettings({ renewalAlertDays: parseInt(e.target.value, 10) || 0 })} className="mt-1 block w-full px-3 py-2 bg-white border border-ui-border rounded-md shadow-sm text-text-primary" />
            </div>
            <div>
                <label htmlFor="currency" className="block text-sm font-medium text-text-secondary mb-1">Moeda (código de 3 letras, ex: BRL, USD)</label>
                <input type="text" name="currency" id="currency" maxLength={3} value={systemSettings.currency} onChange={e => updateSystemSettings({ currency: e.target.value.toUpperCase() })} className="mt-1 block w-full px-3 py-2 bg-white border border-ui-border rounded-md shadow-sm text-text-primary" />
            </div>
        </div>
    );
};


const TeamManagement: React.FC<{ ldrState: LDRState }> = ({ ldrState }) => {
    const { users, addUser, updateUser, deleteUser, refreshUsers } = ldrState;

    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [userFormData, setUserFormData] = useState<Omit<User, 'id'>>({
        name: '', email: '', role: 'Vendedor', permissions: [], avatarUrl: ''
    });
    const [password, setPassword] = useState('');
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);

    const pageNames: { [key in Page]?: string } = {
        [Page.Dashboard]: 'Dashboard',
        [Page.Clients]: 'Clientes',
        [Page.Policies]: 'Apólices',
        [Page.Tasks]: 'Tarefas',
        [Page.Renewals]: 'Renovações',
        [Page.Settings]: 'Configurações',
        [Page.InsuranceCompanies]: 'Seguradoras',
        [Page.SalesFunnel]: 'Funil de Vendas',
    };

    useEffect(() => {
        if (editingUser) {
            setUserFormData({
                name: editingUser.name,
                email: editingUser.email,
                role: editingUser.role,
                permissions: editingUser.permissions || [],
                avatarUrl: editingUser.avatarUrl || '',
            });
            setAvatarPreview(editingUser.avatarUrl || null);
        }
    }, [editingUser]);

    const handleOpenUserModal = (user: User | null = null) => {
        setEditingUser(user);
        if (!user) {
            setUserFormData({ name: '', email: '', role: 'Vendedor', permissions: [], avatarUrl: '' });
            setPassword('');
            setAvatarPreview(null);
        }
        setIsUserModalOpen(true);
    };

    const handleCloseUserModal = () => {
        setIsUserModalOpen(false);
        setEditingUser(null);
        setPassword('');
    };

    const handleUserFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setUserFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setUserFormData(prev => ({ ...prev, avatarUrl: result }));
                setAvatarPreview(result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePermissionChange = (page: Page) => {
        setUserFormData(prev => {
            const newPermissions = prev.permissions.includes(page)
                ? prev.permissions.filter(p => p !== page)
                : [...prev.permissions, page];
            return { ...prev, permissions: newPermissions };
        });
    };

    const handleUserSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            if (editingUser) {
                // Just update existing user in local state
                updateUser({ ...editingUser, ...userFormData });
                toast.success('Usuário atualizado com sucesso!');
            } else {
                // Create new user via edge function
                if (!password || password.length < 6) {
                    toast.error('A senha deve ter pelo menos 6 caracteres');
                    return;
                }

                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    toast.error('Sessão expirada');
                    return;
                }

                const response = await fetch(
                    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`,
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${session.access_token}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            email: userFormData.email,
                            password: password,
                            name: userFormData.name,
                            role: userFormData.role,
                        }),
                    }
                );

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.error || 'Erro ao criar usuário');
                }

                // Reload users from database
                await refreshUsers();
                toast.success('Usuário criado com sucesso! Ele já pode fazer login.');
            }
            handleCloseUserModal();
        } catch (error) {
            console.error('Error managing user:', error);
            toast.error(error instanceof Error ? error.message : 'Erro ao gerenciar usuário');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div>
            <div className="flex justify-end mb-4">
                <Button onClick={() => handleOpenUserModal()} className="bg-blue-600 hover:bg-blue-700 text-white">
                    + Adicionar Usuário
                </Button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-ui-card">
                    <thead className="bg-ui-card">
                        <tr>
                            <th className="py-3 px-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Nome</th>
                            <th className="py-3 px-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Email</th>
                            <th className="py-3 px-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Cargo</th>
                            <th className="py-3 px-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-ui-border">
                        {users.map(user => (
                            <tr key={user.id}>
                                <td className="py-2 px-4 whitespace-nowrap text-sm font-medium text-text-primary">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-ui-hover overflow-hidden flex-shrink-0">
                                            {user.avatarUrl ? (
                                                <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
                                            ) : (
                                                <span className="h-full w-full flex items-center justify-center text-xs font-bold text-text-secondary">{getInitials(user.name)}</span>
                                            )}
                                        </div>
                                        {user.name}
                                    </div>
                                </td>
                                <td className="py-4 px-4 whitespace-nowrap text-sm text-text-secondary">{user.email}</td>
                                <td className="py-4 px-4 whitespace-nowrap text-sm text-text-secondary">{user.role}</td>
                                <td className="py-4 px-4 whitespace-nowrap text-sm font-medium">
                                    <div className="flex items-center gap-4">
                                        <button onClick={() => handleOpenUserModal(user)} className="text-text-secondary hover:text-brand-primary transition-colors"><EditIcon /></button>
                                        <button onClick={() => deleteUser(user.id)} className="text-text-secondary hover:text-danger transition-colors"><TrashIcon /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {isUserModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-ui-card p-8 rounded-lg border border-ui-border w-full max-w-2xl max-h-[90vh] overflow-y-auto relative shadow-2xl">
                        <h2 className="text-2xl font-bold text-text-primary mb-6">{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</h2>
                        <button type="button" onClick={handleCloseUserModal} className="absolute top-4 right-4 text-text-secondary hover:text-text-primary transition-colors" aria-label="Fechar">
                            <CloseIcon />
                        </button>
                        <form ref={formRef} onSubmit={handleUserSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">Foto de Perfil</label>
                                <div className="mt-1 flex items-center gap-4">
                                    <span className="inline-block h-16 w-16 rounded-full overflow-hidden bg-ui-hover">
                                        {avatarPreview ? (
                                            <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
                                        ) : (
                                            <svg className="h-full w-full text-text-muted" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M24 20.993V24H0v-2.997A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                                            </svg>
                                        )}
                                    </span>
                                    <input type="file" id="avatar-upload" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                                    <label htmlFor="avatar-upload" className="cursor-pointer bg-ui-card text-text-secondary border border-ui-border rounded-md py-2 px-3 text-sm font-medium hover:bg-ui-hover">
                                        Alterar
                                    </label>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-text-secondary mb-1">Nome</label>
                                    <input type="text" name="name" id="name" value={userFormData.name} onChange={handleUserFormChange} required className="mt-1 block w-full px-3 py-2 border border-ui-border bg-white rounded-md shadow-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary" />
                                </div>
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-1">Email</label>
                                    <input type="email" name="email" id="email" value={userFormData.email} onChange={handleUserFormChange} required className="mt-1 block w-full px-3 py-2 border border-ui-border bg-white rounded-md shadow-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary" />
                                </div>
                                <div>
                                    <label htmlFor="role" className="block text-sm font-medium text-text-secondary mb-1">Cargo</label>
                                    <select name="role" id="role" value={userFormData.role} onChange={handleUserFormChange} className="mt-1 block w-full px-3 py-2 border border-ui-border bg-white rounded-md shadow-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary">
                                        <option value="Vendedor">Vendedor</option>
                                        <option value="Gestor">Gestor</option>
                                    </select>
                                </div>
                                {!editingUser && (
                                    <div>
                                        <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-1">Senha</label>
                                        <input
                                            type="password"
                                            id="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required={!editingUser}
                                            minLength={6}
                                            placeholder="Mínimo 6 caracteres"
                                            className="mt-1 block w-full px-3 py-2 border border-ui-border bg-white rounded-md shadow-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
                                        />
                                    </div>
                                )}
                            </div>
                            <div>
                                <h3 className="block text-sm font-medium text-text-secondary mb-2">Permissões de Visualização</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 border border-ui-border p-3 rounded-md">
                                    {Object.values(Page).filter(p => pageNames[p]).map(page => (
                                        <label key={page} className="flex items-center text-sm">
                                            <input
                                                type="checkbox"
                                                checked={userFormData.permissions.includes(page)}
                                                onChange={() => handlePermissionChange(page)}
                                                className="mr-2 h-4 w-4 rounded border-ui-border text-brand-primary focus:ring-brand-primary"
                                            />
                                            {pageNames[page]}
                                        </label>
                                    ))}
                                </div>
                                <p className="text-xs text-text-muted mt-2">
                                    Nota: Apenas administradores têm acesso a "Gerenciamento de Usuários" e "Gerenciamento de Equipe" dentro de Configurações.
                                </p>
                            </div>
                            <div className="flex justify-end gap-4 pt-4 mt-6 border-t border-ui-border">
                                <Button type="button" variant="outline" onClick={handleCloseUserModal}>Cancelar</Button>
                                <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white">
                                    {isSubmitting ? 'Processando...' : (editingUser ? 'Salvar' : 'Criar Usuário')}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const Settings: React.FC<SettingsProps> = ({ ldrState, isAdmin = false }) => {
    const { origins, addOrigin, deleteOrigin, policyTypes, addPolicyType, deletePolicyType } = ldrState;
    const [openAccordion, setOpenAccordion] = useState<string | null>('general');

    const toggleAccordion = (section: string) => {
        setOpenAccordion(prev => prev === section ? null : section);
    };

    return (
        <div className="space-y-6">
            <Accordion type="single" collapsible className="space-y-4">
                {isAdmin && (
                    <>
                        <AccordionSection title="Gerenciamento de Usuários (Autenticação)" isOpen={openAccordion === 'auth-users'} onToggle={() => toggleAccordion('auth-users')}>
                            <UserManagement />
                        </AccordionSection>

                        <AccordionSection title="Gerenciamento de Equipe" isOpen={openAccordion === 'users'} onToggle={() => toggleAccordion('users')}>
                            <TeamManagement ldrState={ldrState} />
                        </AccordionSection>
                    </>
                )}

                <AccordionSection title="Configuração de Listas" isOpen={openAccordion === 'lists'} onToggle={() => toggleAccordion('lists')}>
                    <div className="space-y-8">
                        <ListManagement title="Tipos de Apólice" items={policyTypes} onAdd={addPolicyType} onDelete={deletePolicyType} placeholder="Novo tipo de apólice" />
                        <ListManagement title="Origens da Oportunidade" items={origins} onAdd={addOrigin} onDelete={deleteOrigin} placeholder="Nova origem" />
                    </div>
                </AccordionSection>

                <AccordionSection title="Funis e Estágios" isOpen={openAccordion === 'funnel-config'} onToggle={() => toggleAccordion('funnel-config')}>
                    <FunnelConfigurationComponent ldrState={ldrState} />
                </AccordionSection>

                <AccordionSection title="Atividades dos Funis" isOpen={openAccordion === 'funnel-templates'} onToggle={() => toggleAccordion('funnel-templates')}>
                    <FunnelTemplates ldrState={ldrState} />
                </AccordionSection>

                {isAdmin && (
                    <>
                        <AccordionSection title="Cargos" isOpen={openAccordion === 'job-roles'} onToggle={() => toggleAccordion('job-roles')}>
                            <JobRoles />
                        </AccordionSection>

                        <AccordionSection title="Atividades Padrão" isOpen={openAccordion === 'activity-templates'} onToggle={() => toggleAccordion('activity-templates')}>
                            <ActivityTemplates />
                        </AccordionSection>
                    </>
                )}

                <AccordionSection title="Alertas e Moeda" isOpen={openAccordion === 'alerts'} onToggle={() => toggleAccordion('alerts')}>
                    <AlertSettings ldrState={ldrState} />
                </AccordionSection>

                {isAdmin && (
                    <AccordionSection title="Importar Apólices (CSV)" isOpen={openAccordion === 'import-csv'} onToggle={() => toggleAccordion('import-csv')}>
                        <ImportCSV />
                    </AccordionSection>
                )}
        </div>
    );
};

export default Settings;