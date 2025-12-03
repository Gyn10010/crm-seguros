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


const Settings: React.FC<SettingsProps> = ({ ldrState, isAdmin = false }) => {
    const { origins, addOrigin, deleteOrigin, policyTypes, addPolicyType, deletePolicyType } = ldrState;
    const [openAccordion, setOpenAccordion] = useState<string | null>('general');

    const toggleAccordion = (section: string) => {
        setOpenAccordion(prev => prev === section ? null : section);
    };

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                {isAdmin && (
                    <AccordionSection title="GERENCIAMENTO DE USUÁRIOS" isOpen={openAccordion === 'auth-users'} onToggle={() => toggleAccordion('auth-users')}>
                        <UserManagement />
                    </AccordionSection>
                )}

                <AccordionSection title="CONFIGURAÇÃO DE LISTAS" isOpen={openAccordion === 'lists'} onToggle={() => toggleAccordion('lists')}>
                    <div className="space-y-8">
                        <ListManagement title="Tipos de Apólice" items={policyTypes} onAdd={addPolicyType} onDelete={deletePolicyType} placeholder="Novo tipo de apólice" />
                        <ListManagement title="Origens da Oportunidade" items={origins} onAdd={addOrigin} onDelete={deleteOrigin} placeholder="Nova origem" />
                    </div>
                </AccordionSection>

                <AccordionSection title="FUNIS E ESTÁGIOS" isOpen={openAccordion === 'funnel-config'} onToggle={() => toggleAccordion('funnel-config')}>
                    <FunnelConfigurationComponent ldrState={ldrState} />
                </AccordionSection>

                <AccordionSection title="ATIVIDADES DOS FUNIS" isOpen={openAccordion === 'funnel-templates'} onToggle={() => toggleAccordion('funnel-templates')}>
                    <FunnelTemplates ldrState={ldrState} />
                </AccordionSection>

                {isAdmin && (
                    <>
                        <AccordionSection title="CARGOS" isOpen={openAccordion === 'job-roles'} onToggle={() => toggleAccordion('job-roles')}>
                            <JobRoles />
                        </AccordionSection>

                        <AccordionSection title="ATIVIDADES PADRÃO" isOpen={openAccordion === 'activity-templates'} onToggle={() => toggleAccordion('activity-templates')}>
                            <ActivityTemplates />
                        </AccordionSection>
                    </>
                )}

                <AccordionSection title="ALERTAS E MOEDA" isOpen={openAccordion === 'alerts'} onToggle={() => toggleAccordion('alerts')}>
                    <AlertSettings ldrState={ldrState} />
                </AccordionSection>

                {isAdmin && (
                    <AccordionSection title="IMPORTAR APÓLICES (CSV)" isOpen={openAccordion === 'import-csv'} onToggle={() => toggleAccordion('import-csv')}>
                        <ImportCSV />
                    </AccordionSection>
                )}
            </div>
        </div>
    );
};

export default Settings;