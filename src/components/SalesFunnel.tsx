
import React, { useState, DragEvent, useEffect, useRef, useMemo } from 'react';
import { LDRState } from '../hooks/useLDRState';
import { Opportunity, DealType, FunnelActivity, Client } from '../types/index';
import { CloseIcon } from './icons/Icons';
import { Button } from './ui/button';
import { supabase } from '@/integrations/supabase/client';

interface SalesFunnelProps {
    ldrState: LDRState;
    showAlert: (message: string) => void;
}

const OpportunityCard: React.FC<{ opportunity: Opportunity; ldrState: LDRState; onClick: () => void; onActivityToggle: (opportunityId: string, activity: FunnelActivity) => void }> = ({ opportunity, ldrState, onClick, onActivityToggle }) => {
    const { clients, systemSettings } = ldrState;
    const clientName = clients.find(c => c.id === opportunity.clientId)?.name || 'Cliente não encontrado';
    const commissionValue = (opportunity.value * opportunity.commission) / 100;

    const handleDragStart = (e: DragEvent<HTMLDivElement>) => {
        e.stopPropagation();
        e.dataTransfer.setData('opportunityId', opportunity.id);
    };

    const currentStageActivities = opportunity.activities.filter(act => act.stage === opportunity.stage);

    const formatCurrency = (value: number) => {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: systemSettings.currency });
    }

    return (
        <div
            draggable
            onDragStart={handleDragStart}
            onClick={onClick}
            className="bg-ui-card p-3 mb-4 rounded-lg border border-ui-border cursor-pointer hover:border-brand-primary transition-all duration-200 shadow-sm active:cursor-grabbing"
        >
            <h4 className="font-bold text-text-primary text-sm">{opportunity.title}</h4>
            <p className="text-xs text-text-secondary mb-2">{clientName}</p>

            <div className="my-2 space-y-1 text-sm">
                <div className="flex justify-between">
                    <span className="font-medium text-text-secondary">Prêmio:</span>
                    <span className="font-bold text-success">{formatCurrency(opportunity.value)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="font-medium text-text-secondary">Comissão:</span>
                    <span className="font-bold text-text-primary">{formatCurrency(commissionValue)}</span>
                </div>
            </div>

            {currentStageActivities.length > 0 && (
                <div className="mt-3 pt-2 border-t border-ui-border space-y-1">
                    <h5 className="text-xs font-bold text-text-secondary mb-1">Atividades do Estágio</h5>
                    {currentStageActivities.map(activity => (
                        <label key={activity.id} className="flex items-center text-xs text-text-primary cursor-pointer hover:bg-ui-hover p-1 rounded-md" onClick={e => e.stopPropagation()}>
                            <input
                                type="checkbox"
                                checked={activity.completed}
                                onChange={(e) => {
                                    onActivityToggle(opportunity.id, { ...activity, completed: e.target.checked });
                                }}
                                className="mr-2 h-4 w-4 rounded border-ui-border text-brand-primary focus:ring-brand-primary"
                            />
                            <span className={activity.completed ? 'line-through text-text-muted' : ''}>
                                {activity.text}
                            </span>
                        </label>
                    ))}
                </div>
            )}

            <div className="flex flex-wrap gap-2 mt-3 text-xs border-t pt-2 border-ui-border">
                <span className="px-2 py-1 rounded-full font-semibold bg-info-light text-info">{opportunity.dealType}</span>
                <span className="bg-ui-background text-text-secondary border border-ui-border px-2 py-1 rounded-full font-medium">{opportunity.salesperson}</span>
            </div>

            <div className="flex justify-between items-center mt-2 text-xs text-text-secondary">
                <span>Fecha em: {new Date(opportunity.expectedCloseDate.replace(/-/g, '\/')).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span>
            </div>
        </div>
    );
};

const FunnelColumn: React.FC<{
    stage: string;
    opportunities: Opportunity[];
    ldrState: LDRState;
    onDrop: (stage: string, opportunityId: string) => void;
    onCardClick: (opportunity: Opportunity) => void;
    onActivityToggle: (opportunityId: string, activity: FunnelActivity) => void;
}> = ({ stage, opportunities, ldrState, onDrop, onCardClick, onActivityToggle }) => {
    const [isOver, setIsOver] = useState(false);

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsOver(true);
    };

    const handleDragLeave = () => setIsOver(false);

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsOver(false);
        const opportunityId = e.dataTransfer.getData('opportunityId');
        onDrop(stage, opportunityId);
    };

    const totalValue = opportunities.reduce((sum, opp) => sum + opp.value, 0);

    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`w-72 flex-shrink-0 bg-ui-background rounded-lg p-3 border border-ui-border transition-colors duration-300 h-full flex flex-col ${isOver ? 'bg-brand-primary/10' : ''}`}
        >
            <div className="flex items-center mb-2 border-b-2 pb-2 border-ui-border">
                <h3 className="font-bold text-text-primary text-sm">{stage}</h3>
                <span className="ml-2 text-xs text-text-secondary bg-ui-hover rounded-full px-2 py-0.5">{opportunities.length}</span>
            </div>
            <p className="text-sm font-semibold text-text-primary mb-4">
                {totalValue.toLocaleString('pt-BR', { style: 'currency', currency: ldrState.systemSettings.currency })}
            </p>
            <div className="flex-1 overflow-y-auto min-h-0">
                {opportunities.map(opp => <OpportunityCard key={opp.id} opportunity={opp} ldrState={ldrState} onClick={() => onCardClick(opp)} onActivityToggle={onActivityToggle} />)}
            </div>
        </div>
    );
};

const SalesFunnel: React.FC<SalesFunnelProps> = ({ ldrState, showAlert }) => {
    const { opportunities, clients, users, origins, addOpportunity, updateOpportunityStage, updateOpportunity, addFunnelActivity, updateFunnelActivity, policyTypes, insuranceCompanyContacts, funnelConfigurations, funnelStages } = ldrState;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingOpportunityId, setEditingOpportunityId] = useState<string | null>(null);
    const formRef = useRef<HTMLFormElement>(null);
    const clientSearchRef = useRef<HTMLDivElement>(null);

    // Use first funnel as default, or empty string if no funnels exist
    const [activeFunnel, setActiveFunnel] = useState<string>(
        funnelConfigurations.length > 0 ? funnelConfigurations[0].funnelKey : ''
    );

    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [filters, setFilters] = useState({ searchTerm: '', insuranceCompany: 'all', salesperson: 'all' });

    const [activityTemplates, setActivityTemplates] = useState<Array<{ id: string; name: string; responsibleType: string; maxHours: number; isActive: boolean }>>([]);

    const editingOpportunity = useMemo(() =>
        editingOpportunityId ? opportunities.find(o => o.id === editingOpportunityId) : null,
        [editingOpportunityId, opportunities]
    );

    const staffNames = useMemo(() => users.map(u => u.name), [users]);
    const insuranceCompanyNames = useMemo(() => insuranceCompanyContacts.map(c => c.name), [insuranceCompanyContacts]);

    const initialFormData = {
        title: '', value: '', clientId: '', expectedCloseDate: '',
        commissionType: '15', customCommission: '', dealType: DealType.New,
        salesperson: staffNames[0] || '', origin: origins[0] || '', technicalResponsible: staffNames[0] || '', renewalResponsible: staffNames[0] || '',
        insuranceType: policyTypes[0] || '',
        insuranceCompany: insuranceCompanyNames[0] || '',
        notes: '',
    };

    const [opportunityFormData, setOpportunityFormData] = useState(initialFormData);
    const [titleParts, setTitleParts] = useState({ client: true, insuranceType: true, dealType: false, origin: false });

    const [clientSearchTerm, setClientSearchTerm] = useState('');
    const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);


    const [newActivity, setNewActivity] = useState({
        text: '',
        assignedTo: users[0]?.id || '',
        stage: '',
        dueDate: '',
        dueTime: '12:00',
    });

    const filteredClientsForModal = clientSearchTerm
        ? clients.filter(c => c.name.toLowerCase().includes(clientSearchTerm.toLowerCase()))
        : clients;

    useEffect(() => {
        if (editingOpportunity) {
            const commissionStr = String(editingOpportunity.commission);
            const isPreset = ['15', '20', '25'].includes(commissionStr);
            const clientName = clients.find(c => c.id === editingOpportunity.clientId)?.name || '';
            setClientSearchTerm(clientName);
            setOpportunityFormData({
                title: editingOpportunity.title,
                value: String(editingOpportunity.value),
                clientId: editingOpportunity.clientId,
                expectedCloseDate: editingOpportunity.expectedCloseDate,
                commissionType: isPreset ? commissionStr : 'other',
                customCommission: isPreset ? '' : commissionStr,
                dealType: editingOpportunity.dealType,
                salesperson: editingOpportunity.salesperson,
                origin: editingOpportunity.origin,
                technicalResponsible: editingOpportunity.technicalResponsible,
                renewalResponsible: editingOpportunity.renewalResponsible,
                insuranceType: editingOpportunity.insuranceType,
                insuranceCompany: editingOpportunity.insuranceCompany,
                notes: editingOpportunity.notes || '',
            });
            setNewActivity(prev => ({ ...prev, stage: editingOpportunity.stage, dueDate: '', dueTime: '12:00' }))
        }
    }, [editingOpportunity, clients]);

    useEffect(() => {
        if (editingOpportunity) return;

        const parts = [];
        const { clientId, insuranceType, dealType, origin } = opportunityFormData;

        if (titleParts.client) {
            const client = clients.find(c => c.id === clientId);
            if (client) parts.push(client.name);
        }
        if (titleParts.insuranceType) {
            parts.push(insuranceType);
        }
        if (titleParts.dealType) {
            parts.push(dealType);
        }
        if (titleParts.origin) {
            parts.push(origin);
        }

        const newTitle = parts.join(' - ');
        setOpportunityFormData(prev => ({ ...prev, title: newTitle }));

    }, [titleParts, opportunityFormData.clientId, opportunityFormData.insuranceType, opportunityFormData.dealType, opportunityFormData.origin, clients, editingOpportunity]);

    // Load activity templates
    useEffect(() => {
        const loadActivityTemplates = async () => {
            const { data } = await supabase
                .from('activity_templates')
                .select('*')
                .eq('is_active', true)
                .order('order_index', { ascending: true });

            if (data) {
                setActivityTemplates(data.map(t => ({
                    id: t.id,
                    name: t.name,
                    responsibleType: t.responsible_type,
                    maxHours: t.max_hours,
                    isActive: t.is_active,
                })));
            }
        };

        loadActivityTemplates();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (clientSearchRef.current && !clientSearchRef.current.contains(event.target as Node)) {
                setIsClientDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleDrop = (newStage: string, opportunityId: string) => {
        if (!opportunityId) return;

        const opportunity = opportunities.find(o => o.id === opportunityId);
        if (!opportunity) return;

        // Validação genérica: verificar se todas as atividades do estágio atual estão completas
        if (opportunity.stage !== newStage) {
            const currentStageActivities = opportunity.activities.filter(
                (act) => act.stage === opportunity.stage
            );

            if (currentStageActivities.length > 0) {
                const allCompleted = currentStageActivities.every((act) => act.completed);

                if (!allCompleted) {
                    showAlert(
                        `Por favor, complete todas as atividades do estágio atual antes de mover a oportunidade para "${newStage}".`
                    );
                    return;
                }
            }
        }

        updateOpportunityStage(opportunityId, newStage);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingOpportunityId(null);
        setOpportunityFormData(initialFormData);
        setTitleParts({ client: true, insuranceType: true, dealType: false, origin: false });
        setClientSearchTerm('');
    };

    const handleOpenNewModal = () => {
        setEditingOpportunityId(null);
        setOpportunityFormData(initialFormData);
        setTitleParts({ client: true, insuranceType: true, dealType: false, origin: false });
        setClientSearchTerm('');
        setIsModalOpen(true);
    };

    const handleCardClick = (opportunity: Opportunity) => {
        setEditingOpportunityId(opportunity.id);
        setIsModalOpen(true);
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setOpportunityFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleTitlePartsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setTitleParts(prev => ({ ...prev, [name]: checked }));
    };

    const handleClientSelect = (client: Client) => {
        setOpportunityFormData(prev => ({ ...prev, clientId: client.id }));
        setClientSearchTerm(client.name);
        setIsClientDropdownOpen(false);
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const { title, value, clientId, expectedCloseDate, commissionType, customCommission, notes, ...rest } = opportunityFormData;
        if (!title || !value || !clientId || !expectedCloseDate) return;

        // Validate renewalResponsible for Renewal funnel
        const currentFunnelType = editingOpportunity?.funnelType || activeFunnel;
        if (currentFunnelType === 'renewal' && !opportunityFormData.renewalResponsible) {
            showAlert("O campo 'Responsável pela Renovação' é obrigatório para o funil de Renovação.");
            return;
        }

        const commissionStr = commissionType === 'other' ? customCommission : commissionType;
        const finalCommission = parseFloat(commissionStr.replace('%', ''));

        if (isNaN(finalCommission)) {
            console.error("Invalid commission value");
            return;
        }

        const opportunityPayload = {
            title,
            value: parseFloat(value),
            clientId,
            expectedCloseDate,
            commission: finalCommission,
            notes: notes || undefined,
            ...rest
        };

        if (editingOpportunity) {
            updateOpportunity({
                ...editingOpportunity,
                ...opportunityPayload
            });
        } else {
            addOpportunity({
                ...opportunityPayload,
                funnelType: activeFunnel,
            });
        }
        handleCloseModal();
    };

    const handleAddNewActivity = () => {
        if (editingOpportunity && newActivity.text && newActivity.stage && newActivity.assignedTo) {
            addFunnelActivity(editingOpportunity.id, {
                text: newActivity.text,
                stage: newActivity.stage,
                completed: false,
                assignedTo: newActivity.assignedTo,
                dueDate: newActivity.dueDate || undefined,
                dueTime: newActivity.dueTime || undefined,
            });
            setNewActivity({
                text: '',
                assignedTo: users[0]?.id || '',
                stage: editingOpportunity.stage,
                dueDate: '',
                dueTime: '12:00',
            });
        }
    };

    const displayedOpportunities = opportunities
        .filter(opp => opp.funnelType === activeFunnel)
        .filter(opp => {
            const client = ldrState.clients.find(c => c.id === opp.clientId);
            const searchMatch = !filters.searchTerm ||
                opp.title.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                client?.name.toLowerCase().includes(filters.searchTerm.toLowerCase());
            const insuranceMatch = filters.insuranceCompany === 'all' || opp.insuranceCompany === filters.insuranceCompany;
            const salespersonMatch = filters.salesperson === 'all' || opp.salesperson === filters.salesperson;
            return searchMatch && insuranceMatch && salespersonMatch;
        });

    // Get stages for the active funnel from configuration
    const currentFunnelStages = funnelStages
        .filter(stage => stage.funnelKey === activeFunnel)
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map(stage => stage.stageName);

    const FilterModal: React.FC<{ isOpen: boolean, onClose: () => void, onApply: (f: typeof filters) => void, currentFilters: typeof filters }> = ({ isOpen, onClose, onApply, currentFilters }) => {
        const [localFilters, setLocalFilters] = useState(currentFilters);
        if (!isOpen) return null;

        const handleApply = () => {
            onApply(localFilters);
            onClose();
        };

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-ui-card p-8 rounded-lg border border-ui-border w-full max-w-lg relative shadow-2xl">
                    <h2 className="text-2xl font-bold text-text-primary mb-6">Filtrar Oportunidades</h2>
                    <button type="button" onClick={onClose} className="absolute top-4 right-4 text-text-secondary hover:text-text-primary transition-colors" aria-label="Fechar"><CloseIcon /></button>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="searchTerm" className="block text-sm font-medium text-text-secondary mb-1">Buscar por Título ou Cliente</label>
                            <input type="text" id="searchTerm" value={localFilters.searchTerm} onChange={e => setLocalFilters(f => ({ ...f, searchTerm: e.target.value }))} className="mt-1 block w-full px-3 py-2 bg-white border border-ui-border rounded-md shadow-sm text-text-primary" />
                        </div>
                        <div>
                            <label htmlFor="insuranceCompany" className="block text-sm font-medium text-text-secondary mb-1">Seguradora</label>
                            <select id="insuranceCompany" value={localFilters.insuranceCompany} onChange={e => setLocalFilters(f => ({ ...f, insuranceCompany: e.target.value }))} className="mt-1 block w-full px-3 py-2 border border-ui-border bg-white rounded-md shadow-sm text-text-primary">
                                <option value="all">Todas</option>
                                {insuranceCompanyNames.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="salesperson" className="block text-sm font-medium text-text-secondary mb-1">Responsável</label>
                            <select id="salesperson" value={localFilters.salesperson} onChange={e => setLocalFilters(f => ({ ...f, salesperson: e.target.value }))} className="mt-1 block w-full px-3 py-2 border border-ui-border bg-white rounded-md shadow-sm text-text-primary">
                                <option value="all">Todos</option>
                                {staffNames.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-4 pt-4 mt-6 border-t border-ui-border">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-ui-card text-text-secondary border border-ui-border rounded-md hover:bg-ui-hover">Cancelar</button>
                        <button type="button" onClick={handleApply} className="px-4 py-2 bg-brand-primary text-white font-semibold rounded-md hover:bg-brand-primary/90">Aplicar Filtros</button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full space-y-6">
            <h1 className="text-3xl font-bold text-text-primary">Funil de Vendas</h1>
            <div className="mb-6 flex justify-between items-center flex-wrap gap-4">
                <div className="flex items-center gap-2 bg-ui-hover p-1 rounded-lg flex-wrap">
                    {funnelConfigurations.map(funnel => (
                        <button
                            key={funnel.funnelKey}
                            onClick={() => setActiveFunnel(funnel.funnelKey)}
                            className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${activeFunnel === funnel.funnelKey ? 'bg-ui-card text-text-primary shadow' : 'text-text-secondary'}`}
                        >
                            {funnel.funnelName}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        onClick={() => setIsFilterModalOpen(true)}
                    >
                        Filtros
                    </Button>
                    <Button
                        onClick={handleOpenNewModal}
                    >
                        + Nova Oportunidade
                    </Button>
                </div>
            </div>
            <div className="flex-grow flex gap-4 overflow-x-auto pb-4 min-h-0">
                {currentFunnelStages.map(stage => (
                    <FunnelColumn
                        key={stage}
                        stage={stage}
                        opportunities={displayedOpportunities.filter(o => o.stage === stage)}
                        ldrState={ldrState}
                        onDrop={handleDrop}
                        onCardClick={handleCardClick}
                        onActivityToggle={updateFunnelActivity}
                    />
                ))}
            </div>

            <FilterModal isOpen={isFilterModalOpen} onClose={() => setIsFilterModalOpen(false)} onApply={setFilters} currentFilters={filters} />

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-ui-card p-8 rounded-lg border border-ui-border w-full max-w-3xl max-h-[90vh] overflow-y-auto relative shadow-2xl">
                        <h2 className="text-2xl font-bold text-text-primary mb-6">
                            {editingOpportunity ? 'Editar Oportunidade' : 'Nova Oportunidade'}
                        </h2>
                        <button type="button" onClick={handleCloseModal} className="absolute top-4 right-4 text-text-secondary hover:text-text-primary transition-colors" aria-label="Fechar">
                            <CloseIcon />
                        </button>
                        <form ref={formRef} onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                            {!editingOpportunity && (
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-text-secondary mb-1">Gerador de Título</label>
                                    <div className="flex flex-wrap gap-x-4 gap-y-2 mt-1 mb-2 text-sm">
                                        <label className="flex items-center"><input type="checkbox" name="client" checked={titleParts.client} onChange={handleTitlePartsChange} className="mr-1 h-4 w-4 rounded border-ui-border text-brand-primary focus:ring-brand-primary" /> Cliente</label>
                                        <label className="flex items-center"><input type="checkbox" name="insuranceType" checked={titleParts.insuranceType} onChange={handleTitlePartsChange} className="mr-1 h-4 w-4 rounded border-ui-border text-brand-primary focus:ring-brand-primary" /> Tipo de Seguro</label>
                                        <label className="flex items-center"><input type="checkbox" name="dealType" checked={titleParts.dealType} onChange={handleTitlePartsChange} className="mr-1 h-4 w-4 rounded border-ui-border text-brand-primary focus:ring-brand-primary" /> Tipo de Negócio</label>
                                        <label className="flex items-center"><input type="checkbox" name="origin" checked={titleParts.origin} onChange={handleTitlePartsChange} className="mr-1 h-4 w-4 rounded border-ui-border text-brand-primary focus:ring-brand-primary" /> Origem</label>
                                    </div>
                                </div>
                            )}
                            <div className="md:col-span-2">
                                <label htmlFor="title" className="block text-sm font-medium text-text-secondary mb-1">Título</label>
                                <input type="text" name="title" id="title" value={opportunityFormData.title} onChange={handleFormChange} required readOnly={!editingOpportunity && Object.values(titleParts).some(v => v)} className="mt-1 block w-full px-3 py-2 border border-ui-border rounded-md shadow-sm bg-ui-background disabled:text-text-secondary" />
                            </div>

                            <div className="relative" ref={clientSearchRef}>
                                <label htmlFor="clientSearch" className="block text-sm font-medium text-text-secondary mb-1">Cliente</label>
                                <input
                                    type="text"
                                    id="clientSearch"
                                    value={clientSearchTerm}
                                    onChange={(e) => {
                                        setClientSearchTerm(e.target.value);
                                        setIsClientDropdownOpen(true);
                                        setOpportunityFormData(prev => ({ ...prev, clientId: '' }));
                                    }}
                                    onFocus={() => setIsClientDropdownOpen(true)}
                                    placeholder="Pesquisar cliente..."
                                    required
                                    className="mt-1 block w-full px-3 py-2 border border-ui-border bg-white rounded-md shadow-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
                                />
                                {isClientDropdownOpen && (
                                    <div className="absolute z-10 w-full mt-1 bg-ui-card border border-ui-border rounded-md shadow-lg max-h-40 overflow-y-auto">
                                        {filteredClientsForModal.length > 0 ? (
                                            filteredClientsForModal.map(client => (
                                                <div key={client.id} onClick={() => handleClientSelect(client)} className="px-4 py-2 text-sm text-text-primary hover:bg-ui-hover cursor-pointer">
                                                    {client.name}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-4 py-2 text-sm text-text-muted">Nenhum cliente encontrado.</div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label htmlFor="insuranceType" className="block text-sm font-medium text-text-secondary mb-1">Tipo de Seguro</label>
                                <select name="insuranceType" id="insuranceType" value={opportunityFormData.insuranceType} onChange={handleFormChange} required className="mt-1 block w-full px-3 py-2 border border-ui-border bg-white rounded-md shadow-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary">
                                    {policyTypes.map(type => <option key={type} value={type}>{type}</option>)}
                                </select>
                            </div>

                            <div>
                                <label htmlFor="value" className="block text-sm font-medium text-text-secondary mb-1">Valor (Prêmio)</label>
                                <input type="number" step="0.01" name="value" id="value" value={opportunityFormData.value} onChange={handleFormChange} required className="mt-1 block w-full px-3 py-2 border border-ui-border bg-white rounded-md shadow-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary" />
                            </div>
                            <div>
                                <label htmlFor="commissionType" className="block text-sm font-medium text-text-secondary mb-1">Comissão (%)</label>
                                <div className="flex gap-2">
                                    <select name="commissionType" id="commissionType" value={opportunityFormData.commissionType} onChange={handleFormChange} required className="mt-1 block w-full px-3 py-2 border border-ui-border bg-white rounded-md shadow-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary">
                                        <option value="15">15%</option>
                                        <option value="20">20%</option>
                                        <option value="25">25%</option>
                                        <option value="other">Outro</option>
                                    </select>
                                    {opportunityFormData.commissionType === 'other' && (
                                        <input type="text" name="customCommission" placeholder="Ex: 18" value={opportunityFormData.customCommission} onChange={handleFormChange} required className="mt-1 block w-full px-3 py-2 border border-ui-border bg-white rounded-md shadow-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary" />
                                    )}
                                </div>
                            </div>

                            <div>
                                <label htmlFor="insuranceCompany" className="block text-sm font-medium text-text-secondary mb-1">Seguradora</label>
                                <select name="insuranceCompany" id="insuranceCompany" value={opportunityFormData.insuranceCompany} onChange={handleFormChange} required className="mt-1 block w-full px-3 py-2 border border-ui-border bg-white rounded-md shadow-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary">
                                    {insuranceCompanyNames.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>

                            <div>
                                <label htmlFor="dealType" className="block text-sm font-medium text-text-secondary mb-1">Tipo de Negócio</label>
                                <select name="dealType" id="dealType" value={opportunityFormData.dealType} onChange={handleFormChange} required className="mt-1 block w-full px-3 py-2 border border-ui-border bg-white rounded-md shadow-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary">
                                    {Object.values(DealType).map(type => <option key={type} value={type}>{type}</option>)}
                                </select>
                            </div>

                            <div>
                                <label htmlFor="expectedCloseDate" className="block text-sm font-medium text-text-secondary mb-1">Data de Fechamento Prevista</label>
                                <input type="date" name="expectedCloseDate" id="expectedCloseDate" value={opportunityFormData.expectedCloseDate} onChange={handleFormChange} required className="mt-1 block w-full px-3 py-2 border border-ui-border bg-white rounded-md shadow-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary" />
                            </div>
                            <div>
                                <label htmlFor="salesperson" className="block text-sm font-medium text-text-secondary mb-1">Vendedor</label>
                                <select name="salesperson" id="salesperson" value={opportunityFormData.salesperson} onChange={handleFormChange} required className="mt-1 block w-full px-3 py-2 border border-ui-border bg-white rounded-md shadow-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary">
                                    {staffNames.map(person => <option key={person} value={person}>{person}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="origin" className="block text-sm font-medium text-text-secondary mb-1">Origem</label>
                                <select name="origin" id="origin" value={opportunityFormData.origin} onChange={handleFormChange} required className="mt-1 block w-full px-3 py-2 border border-ui-border bg-white rounded-md shadow-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary">
                                    {origins.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="technicalResponsible" className="block text-sm font-medium text-text-secondary mb-1">Responsável Técnico</label>
                                <select name="technicalResponsible" id="technicalResponsible" value={opportunityFormData.technicalResponsible} onChange={handleFormChange} required className="mt-1 block w-full px-3 py-2 border border-ui-border bg-white rounded-md shadow-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary">
                                    {staffNames.map(person => <option key={person} value={person}>{person}</option>)}
                                </select>
                            </div>
                            {(activeFunnel === 'renewal' || editingOpportunity?.funnelType === 'renewal') && (
                                <div>
                                    <label htmlFor="renewalResponsible" className="block text-sm font-medium text-text-secondary mb-1">Responsável pela Renovação</label>
                                    <select name="renewalResponsible" id="renewalResponsible" value={opportunityFormData.renewalResponsible} onChange={handleFormChange} required className="mt-1 block w-full px-3 py-2 border border-ui-border bg-white rounded-md shadow-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary">
                                        {staffNames.map(person => <option key={person} value={person}>{person}</option>)}
                                    </select>
                                </div>
                            )}

                            {editingOpportunity && (
                                <div className="border-t border-ui-border pt-4 mt-4 space-y-4 md:col-span-2">
                                    <h3 className="text-lg font-semibold text-text-primary mb-2">Atividades da Oportunidade</h3>
                                    <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                                        {editingOpportunity.activities.length === 0 ? (
                                            <p className="text-sm text-text-muted italic">Nenhuma atividade cadastrada ainda.</p>
                                        ) : (
                                            <ul className="space-y-2">
                                                {editingOpportunity.activities.map(activity => (
                                                    <li key={activity.id} className="text-sm text-text-primary p-2 bg-ui-background rounded-md">
                                                        <div className="flex items-center justify-between">
                                                            <label className="flex items-center flex-1">
                                                                <input type="checkbox" checked={activity.completed} onChange={() => updateFunnelActivity(editingOpportunity.id, { ...activity, completed: !activity.completed })} className="mr-2 h-4 w-4 rounded border-ui-border text-brand-primary focus:ring-brand-primary" />
                                                                <span className={activity.completed ? 'line-through text-text-muted' : ''}>{activity.text}</span>
                                                            </label>
                                                            <div className="flex items-center gap-2 text-xs text-text-muted">
                                                                {activity.dueDate && (
                                                                    <span>📅 {new Date(activity.dueDate).toLocaleDateString('pt-BR')}</span>
                                                                )}
                                                                {activity.dueTime && (
                                                                    <span>🕐 {activity.dueTime}</span>
                                                                )}
                                                                <span>{users.find(u => u.id === activity.assignedTo)?.name}</span>
                                                            </div>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                    <div className="space-y-3 border-t border-ui-border pt-4">
                                        <h4 className="text-md font-semibold text-text-primary">Adicionar Nova Atividade</h4>
                                        <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-text-secondary mb-1">Atividade</label>
                                                <select
                                                    value={newActivity.text}
                                                    onChange={e => {
                                                        const selectedText = e.target.value;
                                                        setNewActivity(p => ({ ...p, text: selectedText, stage: editingOpportunity.stage }));

                                                        // Auto-fill based on template
                                                        const template = activityTemplates.find(t => t.name === selectedText);
                                                        if (template) {
                                                            // Calculate due date based on maxHours
                                                            const dueDate = new Date();
                                                            dueDate.setHours(dueDate.getHours() + template.maxHours);
                                                            const dueDateStr = dueDate.toISOString().split('T')[0];

                                                            // Find user with matching role
                                                            const matchingUser = users.find(u => u.role === template.responsibleType);

                                                            setNewActivity(p => ({
                                                                ...p,
                                                                text: selectedText,
                                                                stage: editingOpportunity.stage,
                                                                dueDate: dueDateStr,
                                                                assignedTo: matchingUser?.id || p.assignedTo
                                                            }));
                                                        }
                                                    }}
                                                    className="w-full px-3 py-2 border border-ui-border bg-white rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
                                                >
                                                    <option value="">Selecione ou digite uma atividade</option>
                                                    {activityTemplates
                                                        .filter(template => template.isActive)
                                                        .map(template => (
                                                            <option key={template.id} value={template.name}>
                                                                {template.name} - Prazo: {template.maxHours}h - Responsável: {template.responsibleType}
                                                            </option>
                                                        ))
                                                    }
                                                </select>
                                                <input
                                                    type="text"
                                                    placeholder="Ou digite uma nova atividade"
                                                    value={newActivity.text}
                                                    onChange={e => setNewActivity(p => ({ ...p, text: e.target.value, stage: editingOpportunity.stage }))}
                                                    className="w-full px-3 py-2 border border-ui-border bg-white rounded-md mt-2"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-text-secondary mb-1">Responsável</label>
                                                <select
                                                    value={newActivity.assignedTo}
                                                    onChange={e => setNewActivity(p => ({ ...p, assignedTo: e.target.value }))}
                                                    className="w-full px-3 py-2 border border-ui-border bg-white rounded-md"
                                                >
                                                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-text-secondary mb-1">Prazo</label>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <input
                                                        type="date"
                                                        value={newActivity.dueDate}
                                                        onChange={e => setNewActivity(p => ({ ...p, dueDate: e.target.value }))}
                                                        className="w-full px-3 py-2 border border-ui-border bg-white rounded-md text-sm"
                                                        placeholder="Data"
                                                    />
                                                    <input
                                                        type="time"
                                                        value={newActivity.dueTime}
                                                        onChange={e => setNewActivity(p => ({ ...p, dueTime: e.target.value }))}
                                                        className="w-full px-3 py-2 border border-ui-border bg-white rounded-md text-sm"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <button type="button" onClick={handleAddNewActivity} className="px-4 py-2 text-sm bg-brand-primary/10 text-brand-primary font-semibold rounded-md hover:bg-brand-primary/20">Adicionar Atividade</button>
                                    </div>
                                </div>
                            )}

                            <div className="md:col-span-2">
                                <label htmlFor="notes" className="block text-sm font-medium text-text-secondary mb-1">Observações da Oportunidade</label>
                                <textarea name="notes" id="notes" value={opportunityFormData.notes} onChange={handleFormChange} rows={4} className="mt-1 block w-full px-3 py-2 border border-ui-border bg-white rounded-md shadow-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"></textarea>
                            </div>

                            <div className="flex justify-end gap-4 pt-4 mt-6 border-t border-ui-border md:col-span-2">
                                <Button type="button" variant="outline" onClick={handleCloseModal}>Cancelar</Button>
                                <Button type="submit">
                                    {editingOpportunity ? 'Salvar Alterações' : 'Criar Oportunidade'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SalesFunnel;
