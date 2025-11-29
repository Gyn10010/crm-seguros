import React, { useState, useMemo, useRef } from 'react';
import { LDRState } from '../hooks/useLDRState';
import { Renewal, RenewalStatus } from '../types/index';
import { CloseIcon, ArrowUpIcon, ArrowDownIcon } from './icons/Icons';

interface RenewalsProps {
  ldrState: LDRState;
}

const getStatusClass = (status: RenewalStatus) => {
    switch (status) {
        case RenewalStatus.Done:
            return 'bg-success-light text-success';
        case RenewalStatus.InProgress:
            return 'bg-info-light text-info';
        case RenewalStatus.Pending:
            return 'bg-warning-light text-warning';
        case RenewalStatus.Lost:
            return 'bg-danger-light text-danger';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

const Renewals: React.FC<RenewalsProps> = ({ ldrState }) => {
    const { renewals, clients, policies, users, updateRenewal } = ldrState;
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRenewal, setSelectedRenewal] = useState<Renewal | null>(null);
    const [formData, setFormData] = useState<Partial<Renewal>>({});
    const formRef = useRef<HTMLFormElement>(null);
    
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [filters, setFilters] = useState({ searchTerm: '', status: 'all', salesperson: 'all' });
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: string } | null>({ key: 'endDate', direction: 'ascending' });

    const salespeople = useMemo(() => users.map(u => u.name), [users]);

    const filteredAndSortedRenewals = useMemo(() => {
        let processedRenewals = renewals.map(renewal => {
            const client = clients.find(c => c.id === renewal.clientId);
            const policy = policies.find(p => p.id === renewal.policyId);
            return {
                ...renewal,
                clientName: client?.name || 'N/A',
                policyNumber: policy?.policyNumber || 'N/A',
                endDate: policy?.endDate || 'N/A',
            };
        });
        
        processedRenewals = processedRenewals.filter(r => {
            const searchTermMatch = !filters.searchTerm ||
                r.clientName.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                r.policyNumber.toLowerCase().includes(filters.searchTerm.toLowerCase());
            const statusMatch = filters.status === 'all' || r.status === filters.status;
            const salespersonMatch = filters.salesperson === 'all' || r.salesperson === filters.salesperson;
            return searchTermMatch && statusMatch && salespersonMatch;
        });

        if (sortConfig !== null) {
            processedRenewals.sort((a, b) => {
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

        return processedRenewals;
    }, [renewals, clients, policies, filters, sortConfig]);

    const requestSort = (key: string) => {
        let direction = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key: string) => {
        if (!sortConfig || sortConfig.key !== key) {
            return null;
        }
        if (sortConfig.direction === 'ascending') {
            return <ArrowUpIcon className="inline ml-1 h-3 w-3" />;
        }
        return <ArrowDownIcon className="inline ml-1 h-3 w-3" />;
    };

    const handleManageClick = (renewal: any) => {
        setSelectedRenewal(renewal);
        setFormData({
            status: renewal.status,
            salesperson: renewal.salesperson,
            nextContactDate: renewal.nextContactDate,
            notes: renewal.notes,
        });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedRenewal(null);
        setFormData({});
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedRenewal) {
            updateRenewal({ ...selectedRenewal, ...formData });
        }
        handleCloseModal();
    };
    
    const FilterModal: React.FC<{isOpen: boolean, onClose: () => void, onApply: (f: typeof filters) => void, currentFilters: typeof filters}> = ({isOpen, onClose, onApply, currentFilters}) => {
        const [localFilters, setLocalFilters] = useState(currentFilters);
        if (!isOpen) return null;
        
        const handleApply = () => {
            onApply(localFilters);
            onClose();
        };

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-ui-card p-8 rounded-lg border border-ui-border w-full max-w-lg relative shadow-2xl">
                    <h2 className="text-2xl font-bold text-text-primary mb-6">Filtrar Renovações</h2>
                    <button type="button" onClick={onClose} className="absolute top-4 right-4 text-text-secondary hover:text-text-primary transition-colors" aria-label="Fechar"><CloseIcon /></button>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="searchTerm" className="block text-sm font-medium text-text-secondary mb-1">Buscar por Cliente ou Apólice</label>
                            <input type="text" id="searchTerm" value={localFilters.searchTerm} onChange={e => setLocalFilters(f => ({...f, searchTerm: e.target.value}))} className="mt-1 block w-full px-3 py-2 bg-white border border-ui-border rounded-md shadow-sm text-text-primary"/>
                        </div>
                        <div>
                            <label htmlFor="status" className="block text-sm font-medium text-text-secondary mb-1">Status</label>
                            <select id="status" value={localFilters.status} onChange={e => setLocalFilters(f => ({...f, status: e.target.value}))} className="mt-1 block w-full px-3 py-2 border border-ui-border bg-white rounded-md shadow-sm text-text-primary">
                                <option value="all">Todos</option>
                                {Object.values(RenewalStatus).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="salesperson" className="block text-sm font-medium text-text-secondary mb-1">Vendedor</label>
                            <select id="salesperson" value={localFilters.salesperson} onChange={e => setLocalFilters(f => ({...f, salesperson: e.target.value}))} className="mt-1 block w-full px-3 py-2 border border-ui-border bg-white rounded-md shadow-sm text-text-primary">
                                <option value="all">Todos</option>
                                {salespeople.map(s => <option key={s} value={s}>{s}</option>)}
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
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-text-primary">Renovações de Apólices</h1>
            <div className="bg-ui-card p-6 rounded-lg border border-ui-border shadow-sm">
                <div className="flex justify-start mb-4">
                <button 
                    onClick={() => setIsFilterModalOpen(true)} 
                    className="bg-ui-card hover:bg-ui-hover border border-ui-border text-text-secondary font-bold py-2 px-4 rounded-lg transition-colors"
                >
                    Filtros
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-ui-card">
                    <thead className="bg-ui-card">
                        <tr>
                            <th className="py-3 px-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                                <button onClick={() => requestSort('clientName')} className="w-full text-left">Cliente {getSortIcon('clientName')}</button>
                            </th>
                            <th className="py-3 px-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Apólice</th>
                            <th className="py-3 px-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                                <button onClick={() => requestSort('endDate')} className="w-full text-left">Vencimento {getSortIcon('endDate')}</button>
                            </th>
                            <th className="py-3 px-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                                <button onClick={() => requestSort('status')} className="w-full text-left">Status {getSortIcon('status')}</button>
                            </th>
                            <th className="py-3 px-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                                <button onClick={() => requestSort('salesperson')} className="w-full text-left">Vendedor {getSortIcon('salesperson')}</button>
                            </th>
                            <th className="py-3 px-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                                <button onClick={() => requestSort('nextContactDate')} className="w-full text-left">Próximo Contato {getSortIcon('nextContactDate')}</button>
                            </th>
                            <th className="py-3 px-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-ui-border">
                        {filteredAndSortedRenewals.map(renewal => {
                            return (
                                <tr key={renewal.policyId} className="hover:bg-ui-hover">
                                    <td className="py-4 px-4 whitespace-nowrap text-sm font-medium text-text-primary">{renewal.clientName}</td>
                                    <td className="py-4 px-4 whitespace-nowrap text-sm text-text-secondary">{renewal.policyNumber}</td>
                                    <td className="py-4 px-4 whitespace-nowrap text-sm text-text-secondary">{new Date(renewal.endDate).toLocaleDateString('pt-BR')}</td>
                                    <td className="py-4 px-4 whitespace-nowrap text-sm">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(renewal.status)}`}>
                                            {renewal.status}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4 whitespace-nowrap text-sm text-text-secondary">{renewal.salesperson}</td>
                                    <td className="py-4 px-4 whitespace-nowrap text-sm text-text-secondary">
                                        {renewal.nextContactDate ? new Date(renewal.nextContactDate.replace(/-/g, '\/')).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'N/A'}
                                    </td>
                                    <td className="py-4 px-4 whitespace-nowrap text-sm">
                                        <button onClick={() => handleManageClick(renewal)} className="text-brand-primary hover:underline font-semibold">Gerenciar</button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {filteredAndSortedRenewals.length === 0 && (
                <p className="text-center text-text-muted mt-6">Nenhuma renovação encontrada com os filtros selecionados.</p>
            )}

            <FilterModal isOpen={isFilterModalOpen} onClose={() => setIsFilterModalOpen(false)} onApply={setFilters} currentFilters={filters} />

            {isModalOpen && selectedRenewal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-ui-card p-8 rounded-lg border border-ui-border w-full max-w-lg max-h-[90vh] overflow-y-auto relative shadow-2xl">
                        <h2 className="text-2xl font-bold text-text-primary mb-6">Gerenciar Renovação</h2>
                        <button type="button" onClick={handleCloseModal} className="absolute top-4 right-4 text-text-secondary hover:text-text-primary transition-colors" aria-label="Fechar">
                            <CloseIcon />
                        </button>
                        <form ref={formRef} onSubmit={handleFormSubmit} className="space-y-4">
                             <div>
                                <label htmlFor="status" className="block text-sm font-medium text-text-secondary mb-1">Status da Renovação</label>
                                <select name="status" id="status" value={formData.status} onChange={handleFormChange} className="mt-1 block w-full px-3 py-2 border border-ui-border bg-white rounded-md shadow-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary">
                                    {Object.values(RenewalStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="salesperson" className="block text-sm font-medium text-text-secondary mb-1">Vendedor Responsável</label>
                                <select name="salesperson" id="salesperson" value={formData.salesperson} onChange={handleFormChange} className="mt-1 block w-full px-3 py-2 border border-ui-border bg-white rounded-md shadow-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary">
                                    {salespeople.map(person => <option key={person} value={person}>{person}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="nextContactDate" className="block text-sm font-medium text-text-secondary mb-1">Próximo Contato</label>
                                <input type="date" name="nextContactDate" id="nextContactDate" value={formData.nextContactDate || ''} onChange={handleFormChange} className="mt-1 block w-full px-3 py-2 border border-ui-border bg-white rounded-md shadow-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary" />
                            </div>
                            <div>
                                <label htmlFor="notes" className="block text-sm font-medium text-text-secondary mb-1">Observações</label>
                                <textarea name="notes" id="notes" value={formData.notes || ''} onChange={handleFormChange} rows={5} className="mt-1 block w-full px-3 py-2 border border-ui-border bg-white rounded-md shadow-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"></textarea>
                            </div>
                            <div className="flex justify-end gap-4 pt-4 mt-6 border-t border-ui-border">
                                <button type="button" onClick={handleCloseModal} className="px-4 py-2 bg-ui-card text-text-secondary border border-ui-border rounded-md hover:bg-ui-hover">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-brand-primary text-white font-semibold rounded-md hover:bg-brand-primary/90">
                                    Salvar Alterações
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    </div>
    );
};

export default Renewals;