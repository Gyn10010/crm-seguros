import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Policy, PolicyStatus, PolicyType, Client, PolicyFieldConfig } from '../types/index';
import { LDRState } from '../hooks/useLDRState';
import { EditIcon, TrashIcon, CloseIcon, ArrowUpIcon, ArrowDownIcon } from './icons/Icons';
import { Button } from './ui/button';
import { PolicyFieldsConfig } from './PolicyFieldsConfig';
import { Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ImportCSV } from './ImportCSV';

interface PolicyListProps {
    ldrState: LDRState;
}

const getStatusClass = (status: PolicyStatus) => {
    switch (status) {
        case PolicyStatus.Active:
            return 'bg-success-light text-success';
        case PolicyStatus.Pending:
            return 'bg-warning-light text-warning';
        case PolicyStatus.Expired:
        case PolicyStatus.Canceled:
            return 'bg-danger-light text-danger';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

const PolicyModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (policyData: Omit<Policy, 'id'>) => void;
    policy: Policy | null;
    clients: Client[];
    ldrState: LDRState;
}> = ({ isOpen, onClose, onSubmit, policy, clients, ldrState }) => {
    const { policyTypes, insuranceCompanyContacts, systemSettings } = ldrState;
    const initialFormState: Omit<Policy, 'id'> = {
        clientId: '',
        policyNumber: '',
        insuranceCompany: insuranceCompanyContacts[0]?.name || '',
        type: policyTypes[0] || '',
        premium: 0,
        commission: 15,
        startDate: '',
        endDate: '',
        status: PolicyStatus.Pending,
        documentType: '',
        netPremium: 0,
        generatedCommission: 0,
        installments: 1,
        paymentType: '',
        branch: '',
        product: '',
        item: '',
        proposal: '',
        endorsementProposal: '',
        endorsement: '',
        sellerTransfer: 0,
    };
    const [formData, setFormData] = useState<Omit<Policy, 'id'>>(initialFormState);
    const [fieldConfigs, setFieldConfigs] = useState<Record<string, boolean>>({});
    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        loadFieldConfigs();
        if (policy) {
            setFormData({ ...initialFormState, ...policy });
        } else {
            setFormData(initialFormState);
        }
    }, [policy, isOpen]);

    const loadFieldConfigs = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data } = await supabase
                .from('policy_field_config')
                .select('*')
                .eq('user_id', user.id);

            const configs: Record<string, boolean> = {};
            data?.forEach((config) => {
                configs[config.field_name] = config.is_required;
            });
            setFieldConfigs(configs);
        } catch (error) {
            console.error('Error loading field configs:', error);
        }
    };

    const isFieldRequired = (fieldName: string) => {
        return fieldConfigs[fieldName] || false;
    };

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const isNumber = (e.target as HTMLInputElement).type === 'number';
        setFormData({ ...formData, [name]: isNumber ? parseFloat(value) : value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-ui-card p-8 rounded-lg border border-ui-border w-full max-w-4xl max-h-[90vh] overflow-y-auto relative shadow-2xl">
                <h2 className="text-2xl font-bold text-text-primary mb-6">{policy ? 'Editar Apólice' : 'Nova Apólice'}</h2>
                <button type="button" onClick={onClose} className="absolute top-4 right-4 text-text-secondary hover:text-text-primary transition-colors" aria-label="Fechar">
                    <CloseIcon />
                </button>
                <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
                    {/* Cliente e Tipo Documento */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="clientId" className="block text-sm font-medium text-text-secondary mb-1">Cliente</label>
                            <select name="clientId" id="clientId" value={formData.clientId} onChange={handleChange} required={isFieldRequired('clientId')} className="mt-1 block w-full px-3 py-2 border border-ui-border bg-white rounded-md shadow-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary">
                                <option value="" disabled>Selecione um cliente</option>
                                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="documentType" className="block text-sm font-medium text-text-secondary mb-1">Tipo Documento</label>
                            <select name="documentType" id="documentType" value={formData.documentType} onChange={handleChange} required={isFieldRequired('documentType')} className="mt-1 block w-full px-3 py-2 border border-ui-border bg-white rounded-md shadow-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary">
                                <option value="">Selecione</option>
                                <option value="Apólice">Apólice</option>
                                <option value="Endosso">Endosso</option>
                            </select>
                        </div>
                    </div>

                    {/* Vigências */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="startDate" className="block text-sm font-medium text-text-secondary mb-1">Vigência Inicial</label>
                            <input type="date" name="startDate" id="startDate" value={formData.startDate} onChange={handleChange} required={isFieldRequired('startDate')} className="mt-1 block w-full px-3 py-2 border border-ui-border bg-white rounded-md shadow-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary" />
                        </div>
                        <div>
                            <label htmlFor="endDate" className="block text-sm font-medium text-text-secondary mb-1">Vigência Final</label>
                            <input type="date" name="endDate" id="endDate" value={formData.endDate} onChange={handleChange} required={isFieldRequired('endDate')} className="mt-1 block w-full px-3 py-2 border border-ui-border bg-white rounded-md shadow-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary" />
                        </div>
                    </div>

                    {/* Prêmios e Comissões */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label htmlFor="netPremium" className="block text-sm font-medium text-text-secondary mb-1">Prêmio Líquido ({systemSettings.currency})</label>
                            <input type="number" step="0.01" name="netPremium" id="netPremium" value={formData.netPremium} onChange={handleChange} required={isFieldRequired('netPremium')} className="mt-1 block w-full px-3 py-2 border border-ui-border bg-white rounded-md shadow-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary" />
                        </div>
                        <div>
                            <label htmlFor="premium" className="block text-sm font-medium text-text-secondary mb-1">Prêmio Total ({systemSettings.currency})</label>
                            <input type="number" step="0.01" name="premium" id="premium" value={formData.premium} onChange={handleChange} required={isFieldRequired('premium')} className="mt-1 block w-full px-3 py-2 border border-ui-border bg-white rounded-md shadow-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary" />
                        </div>
                        <div>
                            <label htmlFor="commission" className="block text-sm font-medium text-text-secondary mb-1">Comissão (%)</label>
                            <input type="number" step="1" name="commission" id="commission" value={formData.commission} onChange={handleChange} required={isFieldRequired('commission')} className="mt-1 block w-full px-3 py-2 border border-ui-border bg-white rounded-md shadow-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="generatedCommission" className="block text-sm font-medium text-text-secondary mb-1">Comissão Gerada ({systemSettings.currency})</label>
                            <input type="number" step="0.01" name="generatedCommission" id="generatedCommission" value={formData.generatedCommission} onChange={handleChange} required={isFieldRequired('generatedCommission')} className="mt-1 block w-full px-3 py-2 border border-ui-border bg-white rounded-md shadow-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary" />
                        </div>
                        <div>
                            <label htmlFor="sellerTransfer" className="block text-sm font-medium text-text-secondary mb-1">Repasse Vendedor ({systemSettings.currency})</label>
                            <input type="number" step="0.01" name="sellerTransfer" id="sellerTransfer" value={formData.sellerTransfer} onChange={handleChange} required={isFieldRequired('sellerTransfer')} className="mt-1 block w-full px-3 py-2 border border-ui-border bg-white rounded-md shadow-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary" />
                        </div>
                    </div>

                    {/* Pagamento */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="installments" className="block text-sm font-medium text-text-secondary mb-1">Quantidade Parcelas</label>
                            <input type="number" name="installments" id="installments" value={formData.installments} onChange={handleChange} required={isFieldRequired('installments')} className="mt-1 block w-full px-3 py-2 border border-ui-border bg-white rounded-md shadow-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary" />
                        </div>
                        <div>
                            <label htmlFor="paymentType" className="block text-sm font-medium text-text-secondary mb-1">Tipo Pagamento</label>
                            <input type="text" name="paymentType" id="paymentType" value={formData.paymentType} onChange={handleChange} required={isFieldRequired('paymentType')} placeholder="Ex: Cartão, Boleto, PIX" className="mt-1 block w-full px-3 py-2 border border-ui-border bg-white rounded-md shadow-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary" />
                        </div>
                    </div>

                    {/* Seguradora e Classificação */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="insuranceCompany" className="block text-sm font-medium text-text-secondary mb-1">Seguradora</label>
                            <select name="insuranceCompany" id="insuranceCompany" value={formData.insuranceCompany} onChange={handleChange} required={isFieldRequired('insuranceCompany')} className="mt-1 block w-full px-3 py-2 border border-ui-border bg-white rounded-md shadow-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary">
                                {insuranceCompanyContacts.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="branch" className="block text-sm font-medium text-text-secondary mb-1">Ramo</label>
                            <input type="text" name="branch" id="branch" value={formData.branch} onChange={handleChange} required={isFieldRequired('branch')} placeholder="Ex: Auto, Vida, Patrimonial" className="mt-1 block w-full px-3 py-2 border border-ui-border bg-white rounded-md shadow-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="product" className="block text-sm font-medium text-text-secondary mb-1">Produto</label>
                            <input type="text" name="product" id="product" value={formData.product} onChange={handleChange} required={isFieldRequired('product')} className="mt-1 block w-full px-3 py-2 border border-ui-border bg-white rounded-md shadow-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary" />
                        </div>
                        <div>
                            <label htmlFor="item" className="block text-sm font-medium text-text-secondary mb-1">Item</label>
                            <input type="text" name="item" id="item" value={formData.item} onChange={handleChange} required={isFieldRequired('item')} className="mt-1 block w-full px-3 py-2 border border-ui-border bg-white rounded-md shadow-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary" />
                        </div>
                    </div>

                    {/* Documentos */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="proposal" className="block text-sm font-medium text-text-secondary mb-1">Proposta</label>
                            <input type="text" name="proposal" id="proposal" value={formData.proposal} onChange={handleChange} required={isFieldRequired('proposal')} className="mt-1 block w-full px-3 py-2 border border-ui-border bg-white rounded-md shadow-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary" />
                        </div>
                        <div>
                            <label htmlFor="policyNumber" className="block text-sm font-medium text-text-secondary mb-1">Nº da Apólice</label>
                            <input type="text" name="policyNumber" id="policyNumber" value={formData.policyNumber} onChange={handleChange} required={isFieldRequired('policyNumber')} className="mt-1 block w-full px-3 py-2 border border-ui-border bg-white rounded-md shadow-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="endorsementProposal" className="block text-sm font-medium text-text-secondary mb-1">Proposta Endosso</label>
                            <input type="text" name="endorsementProposal" id="endorsementProposal" value={formData.endorsementProposal} onChange={handleChange} required={isFieldRequired('endorsementProposal')} className="mt-1 block w-full px-3 py-2 border border-ui-border bg-white rounded-md shadow-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary" />
                        </div>
                        <div>
                            <label htmlFor="endorsement" className="block text-sm font-medium text-text-secondary mb-1">Endosso</label>
                            <input type="text" name="endorsement" id="endorsement" value={formData.endorsement} onChange={handleChange} required={isFieldRequired('endorsement')} className="mt-1 block w-full px-3 py-2 border border-ui-border bg-white rounded-md shadow-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary" />
                        </div>
                    </div>

                    {/* Tipo e Status */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="type" className="block text-sm font-medium text-text-secondary mb-1">Tipo de Seguro</label>
                            <select name="type" id="type" value={formData.type} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-ui-border bg-white rounded-md shadow-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary">
                                {policyTypes.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="status" className="block text-sm font-medium text-text-secondary mb-1">Status Apólice</label>
                            <select name="status" id="status" value={formData.status} onChange={handleChange} required={isFieldRequired('status')} className="mt-1 block w-full px-3 py-2 border border-ui-border bg-white rounded-md shadow-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary">
                                {Object.values(PolicyStatus).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end gap-4 pt-4 mt-6 border-t border-ui-border">
                        <Button type="button" onClick={onClose} variant="outline">Cancelar</Button>
                        <Button type="submit" variant="default">
                            {policy ? 'Salvar Alterações' : 'Adicionar Apólice'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const PolicyList: React.FC<PolicyListProps> = ({ ldrState }) => {
    const { policies, clients, addPolicy, updatePolicy, deletePolicy, policyTypes, systemSettings } = ldrState;
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<PolicyType | 'all'>('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: string } | null>({ key: 'endDate', direction: 'ascending' });
    const [showFieldConfig, setShowFieldConfig] = useState(false);

    const rankedCompanies = useMemo(() => {
        const companyStats = policies.reduce((acc, policy) => {
            const company = policy.insuranceCompany;
            if (!acc[company]) {
                acc[company] = { premium: 0, count: 0 };
            }
            if (policy.status === PolicyStatus.Active) {
                acc[company].premium += policy.premium;
                acc[company].count += 1;
            }
            return acc;
        }, {} as Record<string, { premium: number, count: number }>);

        return Object.entries(companyStats)
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.premium - a.premium);
    }, [policies]);

    const filteredPolicies = useMemo(() => policies.filter(policy => {
        const client = clients.find(c => c.id === policy.clientId);
        const searchMatch = client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            policy.policyNumber.toLowerCase().includes(searchTerm.toLowerCase());
        const typeMatch = filterType === 'all' || policy.type === filterType;
        return searchMatch && typeMatch;
    }), [policies, clients, searchTerm, filterType]);

    const sortedPolicies = useMemo(() => {
        let sortableItems = filteredPolicies.map(p => ({
            ...p,
            clientName: clients.find(c => c.id === p.clientId)?.name || ''
        }));

        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                const keyA = a[sortConfig.key as keyof typeof a];
                const keyB = b[sortConfig.key as keyof typeof a];
                if (keyA < keyB) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (keyA > keyB) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [filteredPolicies, clients, sortConfig]);

    const requestSort = (key: string) => {
        let direction = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key: string) => {
        if (!sortConfig || sortConfig.key !== key) return null;
        if (sortConfig.direction === 'ascending') return <ArrowUpIcon className="inline ml-1 h-3 w-3" />;
        return <ArrowDownIcon className="inline ml-1 h-3 w-3" />;
    };

    const handleOpenModal = (policy: Policy | null = null) => {
        setEditingPolicy(policy);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setEditingPolicy(null);
        setIsModalOpen(false);
    };

    const handleSubmit = (policyData: Omit<Policy, 'id'>) => {
        if (editingPolicy) {
            updatePolicy({ ...editingPolicy, ...policyData });
        } else {
            addPolicy(policyData);
        }
        handleCloseModal();
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <Button onClick={() => setShowFieldConfig(true)} variant="outline" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Configurar Campos
                </Button>
            </div>

            {showFieldConfig && (
                <PolicyFieldsConfig onClose={() => setShowFieldConfig(false)} />
            )}

            <Tabs defaultValue="list" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-md">
                    <TabsTrigger value="list">Lista de Apólices</TabsTrigger>
                    <TabsTrigger value="import">Importar Apólices</TabsTrigger>
                </TabsList>

                <TabsContent value="list" className="space-y-6 mt-6">
                    <div className="bg-ui-card p-6 rounded-lg border border-ui-border shadow-sm">
                        <h2 className="text-xl font-bold text-text-primary mb-4">Ranking de Seguradoras (Apólices Ativas)</h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-ui-card">
                                <thead className="bg-ui-card">
                                    <tr>
                                        <th className="py-2 px-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Rank</th>
                                        <th className="py-2 px-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Seguradora</th>
                                        <th className="py-2 px-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Nº Apólices</th>
                                        <th className="py-2 px-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Prêmio Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-ui-border">
                                    {rankedCompanies.map((company, index) => (
                                        <tr key={company.name}>
                                            <td className="py-3 px-4 whitespace-nowrap text-sm font-bold text-text-primary">#{index + 1}</td>
                                            <td className="py-3 px-4 whitespace-nowrap text-sm text-text-primary">{company.name}</td>
                                            <td className="py-3 px-4 whitespace-nowrap text-sm text-text-secondary">{company.count}</td>
                                            <td className="py-3 px-4 whitespace-nowrap text-sm text-text-secondary">{company.premium.toLocaleString('pt-BR', { style: 'currency', currency: systemSettings.currency })}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="bg-ui-card p-6 rounded-lg border border-ui-border shadow-sm">
                        <div className="flex justify-between items-center mb-4 gap-4 flex-wrap">
                            <div className="flex gap-4 flex-grow">
                                <input
                                    type="text"
                                    placeholder="Buscar por cliente ou apólice..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full md:w-2/5 p-2 bg-white border border-ui-border rounded-md text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary"
                                />
                                <select
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value as PolicyType | 'all')}
                                    className="w-full md:w-1/5 p-2 border border-ui-border bg-white rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
                                >
                                    <option value="all">Todos os Tipos</option>
                                    {policyTypes.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>
                            <Button onClick={() => handleOpenModal()} className="font-bold">
                                + Nova Apólice
                            </Button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-ui-card">
                                <thead className="bg-ui-card">
                                    <tr>
                                        <th className="py-3 px-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                                            <button onClick={() => requestSort('clientName')} className="w-full text-left">Cliente {getSortIcon('clientName')}</button>
                                        </th>
                                        <th className="py-3 px-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                                            <button onClick={() => requestSort('policyNumber')} className="w-full text-left">Nº Apólice {getSortIcon('policyNumber')}</button>
                                        </th>
                                        <th className="py-3 px-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                                            <button onClick={() => requestSort('type')} className="w-full text-left">Tipo {getSortIcon('type')}</button>
                                        </th>
                                        <th className="py-3 px-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                                            <button onClick={() => requestSort('premium')} className="w-full text-left">Prêmio {getSortIcon('premium')}</button>
                                        </th>
                                        <th className="py-3 px-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                                            <button onClick={() => requestSort('endDate')} className="w-full text-left">Vencimento {getSortIcon('endDate')}</button>
                                        </th>
                                        <th className="py-3 px-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                                            <button onClick={() => requestSort('status')} className="w-full text-left">Status {getSortIcon('status')}</button>
                                        </th>
                                        <th className="py-3 px-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-ui-border">
                                    {sortedPolicies.map(policy => (
                                        <tr key={policy.id} className="hover:bg-ui-hover">
                                            <td className="py-4 px-4 whitespace-nowrap text-sm font-medium text-text-primary">{policy.clientName}</td>
                                            <td className="py-4 px-4 whitespace-nowrap text-sm text-text-secondary">
                                                {policy.policyNumber}
                                            </td>
                                            <td className="py-4 px-4 whitespace-nowrap text-sm text-text-secondary">{policy.type}</td>
                                            <td className="py-4 px-4 whitespace-nowrap text-sm text-text-secondary">{policy.premium.toLocaleString('pt-BR', { style: 'currency', currency: systemSettings.currency })}</td>
                                            <td className="py-4 px-4 whitespace-nowrap text-sm text-text-secondary">{new Date(policy.endDate).toLocaleDateString('pt-BR')}</td>
                                            <td className="py-4 px-4 whitespace-nowrap text-sm">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(policy.status)}`}>
                                                    {policy.status}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 whitespace-nowrap text-sm">
                                                <div className="flex items-center gap-4">
                                                    <button onClick={() => handleOpenModal(policy)} className="text-text-secondary hover:text-brand-primary transition-colors"><EditIcon /></button>
                                                    <button onClick={() => deletePolicy(policy.id)} className="text-text-secondary hover:text-danger transition-colors"><TrashIcon /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {sortedPolicies.length === 0 && (
                            <p className="text-center text-text-muted mt-6">Nenhuma apólice encontrada.</p>
                        )}
                        <PolicyModal
                            isOpen={isModalOpen}
                            onClose={handleCloseModal}
                            onSubmit={handleSubmit}
                            policy={editingPolicy}
                            clients={clients}
                            ldrState={ldrState}
                        />
                    </div>
                </TabsContent>

                <TabsContent value="import" className="mt-6">
                    <ImportCSV />
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default PolicyList;