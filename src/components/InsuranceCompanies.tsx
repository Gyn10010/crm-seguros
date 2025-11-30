import React, { useState, useRef, useEffect, useMemo } from 'react';
import { LDRState } from '../hooks/useLDRState';
import { InsuranceCompanyContact, Credential } from '../types/index';
import { CloseIcon, TrashIcon, EditIcon, LinkIcon, ArrowUpIcon, ArrowDownIcon } from './icons/Icons';
import { Button } from './ui/button';
import { Search } from 'lucide-react';

interface InsuranceCompaniesProps {
    ldrState: LDRState;
}

const EyeIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);

const EyeOffIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7 1.274-4.057 5.064-7 9.542-7 .847 0 1.67.111 2.458.318M15 12a3 3 0 11-6 0 3 3 0 016 0zm6 3l-2.647-2.646M3 3l2.647 2.646" />
    </svg>
);

const InsuranceCompanyModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (companyData: Omit<InsuranceCompanyContact, 'id'>) => void;
    company: InsuranceCompanyContact | null;
}> = ({ isOpen, onClose, onSubmit, company }) => {
    const initialFormState = { name: '', contactPerson: '', phone: '', email: '', credentials: [], portalUrl: '' };
    const [formData, setFormData] = useState<Omit<InsuranceCompanyContact, 'id'>>(initialFormState);
    const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        if (company) {
            setFormData(company);
        } else {
            setFormData(initialFormState);
        }
    }, [company, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleCredentialChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const newCredentials = [...formData.credentials];
        newCredentials[index] = { ...newCredentials[index], [e.target.name]: e.target.value };
        setFormData({ ...formData, credentials: newCredentials });
    };

    const addCredential = () => {
        setFormData({
            ...formData,
            credentials: [...formData.credentials, { id: `cred-${Date.now()}`, systemName: '', login: '', password: '' }]
        });
    };

    const removeCredential = (index: number) => {
        const newCredentials = formData.credentials.filter((_, i) => i !== index);
        setFormData({ ...formData, credentials: newCredentials });
    };

    const toggleShowPassword = (credId: string) => {
        setShowPasswords(prev => ({ ...prev, [credId]: !prev[credId] }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-ui-card p-8 rounded-lg border border-ui-border w-full max-w-2xl max-h-[90vh] overflow-y-auto relative shadow-2xl">
                <h2 className="text-2xl font-bold text-text-primary mb-6">{company ? 'Editar Seguradora' : 'Nova Seguradora'}</h2>
                <button type="button" onClick={onClose} className="absolute top-4 right-4 text-text-secondary hover:text-text-primary transition-colors" aria-label="Fechar">
                    <CloseIcon />
                </button>
                <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-text-secondary mb-1">Nome da Seguradora</label>
                        <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-ui-border rounded-md shadow-sm text-text-primary" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="contactPerson" className="block text-sm font-medium text-text-secondary mb-1">Contato Comercial</label>
                            <input type="text" name="contactPerson" id="contactPerson" value={formData.contactPerson} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-ui-border rounded-md shadow-sm text-text-primary" />
                        </div>
                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-text-secondary mb-1">Telefone</label>
                            <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-ui-border rounded-md shadow-sm text-text-primary" />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-1">Email</label>
                        <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-ui-border rounded-md shadow-sm text-text-primary" />
                    </div>
                    <div>
                        <label htmlFor="portalUrl" className="block text-sm font-medium text-text-secondary mb-1">Link do Portal</label>
                        <input type="url" name="portalUrl" id="portalUrl" value={formData.portalUrl || ''} onChange={handleChange} placeholder="https://portal.seguradora.com" className="mt-1 block w-full px-3 py-2 bg-white border border-ui-border rounded-md shadow-sm text-text-primary" />
                    </div>

                    <div className="border-t border-ui-border pt-4 mt-4 space-y-4">
                        <h3 className="text-lg font-semibold text-text-primary">Credenciais de Acesso</h3>
                        {formData.credentials.map((cred, index) => (
                            <div key={cred.id} className="p-3 bg-ui-background rounded-md border border-ui-border grid grid-cols-1 md:grid-cols-3 gap-3 relative">
                                <input type="text" name="systemName" placeholder="Sistema (Ex: Portal Corretor)" value={cred.systemName} onChange={e => handleCredentialChange(index, e)} className="px-3 py-2 bg-white border border-ui-border rounded-md" />
                                <input type="text" name="login" placeholder="Login" value={cred.login} onChange={e => handleCredentialChange(index, e)} className="px-3 py-2 bg-white border border-ui-border rounded-md" />
                                <div className="relative">
                                    <input type={showPasswords[cred.id] ? 'text' : 'password'} name="password" placeholder="Senha" value={cred.password} onChange={e => handleCredentialChange(index, e)} className="w-full px-3 py-2 bg-white border border-ui-border rounded-md" />
                                    <button type="button" onClick={() => toggleShowPassword(cred.id)} className="absolute inset-y-0 right-0 px-3 flex items-center text-text-secondary">
                                        {showPasswords[cred.id] ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                    </button>
                                </div>
                                <button type="button" onClick={() => removeCredential(index)} className="absolute -top-2 -right-2 bg-danger text-white rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold">&times;</button>
                            </div>
                        ))}
                        <button type="button" onClick={addCredential} className="px-4 py-2 text-sm bg-brand-primary/10 text-brand-primary font-semibold rounded-md hover:bg-brand-primary/20">
                            + Adicionar Credencial
                        </button>
                    </div>

                    <div className="flex justify-end gap-4 pt-4 mt-6 border-t border-ui-border">
                        <Button type="button" onClick={onClose} variant="outline">Cancelar</Button>
                        <Button type="submit" variant="default">
                            {company ? 'Salvar Alterações' : 'Adicionar Seguradora'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const InsuranceCompanies: React.FC<InsuranceCompaniesProps> = ({ ldrState }) => {
    const { insuranceCompanyContacts, addInsuranceCompanyContact, updateInsuranceCompanyContact, deleteInsuranceCompanyContact } = ldrState;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCompany, setEditingCompany] = useState<InsuranceCompanyContact | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: keyof InsuranceCompanyContact; direction: string } | null>({ key: 'name', direction: 'ascending' });
    const [searchTerm, setSearchTerm] = useState('');

    const filteredAndSortedCompanies = useMemo(() => {
        // First, filter by search term
        let filteredItems = insuranceCompanyContacts.filter(company => {
            const searchLower = searchTerm.toLowerCase();
            return (
                company.name.toLowerCase().includes(searchLower) ||
                company.contactPerson.toLowerCase().includes(searchLower) ||
                company.phone.toLowerCase().includes(searchLower) ||
                company.email.toLowerCase().includes(searchLower)
            );
        });

        // Then, sort
        if (sortConfig !== null) {
            filteredItems.sort((a, b) => {
                const keyA = a[sortConfig.key];
                const keyB = b[sortConfig.key];
                if (keyA < keyB) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (keyA > keyB) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return filteredItems;
    }, [insuranceCompanyContacts, sortConfig, searchTerm]);

    const requestSort = (key: keyof InsuranceCompanyContact) => {
        let direction = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key: keyof InsuranceCompanyContact) => {
        if (!sortConfig || sortConfig.key !== key) return null;
        if (sortConfig.direction === 'ascending') return <ArrowUpIcon className="inline ml-1 h-3 w-3" />;
        return <ArrowDownIcon className="inline ml-1 h-3 w-3" />;
    };

    const handleOpenModal = (company: InsuranceCompanyContact | null = null) => {
        setEditingCompany(company);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setEditingCompany(null);
        setIsModalOpen(false);
    };

    const handleSubmit = (companyData: Omit<InsuranceCompanyContact, 'id'>) => {
        if (editingCompany) {
            updateInsuranceCompanyContact({ ...editingCompany, ...companyData });
        } else {
            addInsuranceCompanyContact(companyData);
        }
        handleCloseModal();
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-text-primary">Seguradoras</h1>
                <Button onClick={() => handleOpenModal()} className="whitespace-nowrap">
                    + Nova Seguradora
                </Button>
            </div>
            <div className="bg-ui-card p-6 rounded-lg border border-ui-border shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                    {/* Search Bar */}
                    <div className="relative w-full md:w-96">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-text-muted" />
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar seguradoras..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-ui-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-muted hover:text-text-primary"
                            >
                                <CloseIcon />
                            </button>
                        )}
                    </div>

                    <Button onClick={() => handleOpenModal()} className="whitespace-nowrap">
                        + Nova Seguradora
                    </Button>
                </div>

                {searchTerm && (
                    <p className="text-sm text-text-muted mb-4">
                        Mostrando {filteredAndSortedCompanies.length} de {insuranceCompanyContacts.length} seguradoras
                    </p>
                )}

                <div className="overflow-x-auto">
                    <table className="min-w-full bg-ui-card">
                        <thead className="bg-ui-card">
                            <tr>
                                <th className="py-3 px-6 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                                    <button onClick={() => requestSort('name')} className="w-full text-left">Seguradora {getSortIcon('name')}</button>
                                </th>
                                <th className="py-3 px-6 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                                    <button onClick={() => requestSort('contactPerson')} className="w-full text-left">Contato Comercial {getSortIcon('contactPerson')}</button>
                                </th>
                                <th className="py-3 px-6 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                                    <button onClick={() => requestSort('phone')} className="w-full text-left">Telefone {getSortIcon('phone')}</button>
                                </th>
                                <th className="py-3 px-6 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                                    <button onClick={() => requestSort('email')} className="w-full text-left">Email {getSortIcon('email')}</button>
                                </th>
                                <th className="py-3 px-6 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Portal</th>
                                <th className="py-3 px-6 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-ui-border">
                            {filteredAndSortedCompanies.map(company => (
                                <tr key={company.id} className="hover:bg-ui-hover">
                                    <td className="py-4 px-6 whitespace-nowrap text-sm font-medium text-text-primary">{company.name}</td>
                                    <td className="py-4 px-6 whitespace-nowrap text-sm text-text-secondary">{company.contactPerson}</td>
                                    <td className="py-4 px-6 whitespace-nowrap text-sm text-text-secondary">{company.phone}</td>
                                    <td className="py-4 px-6 whitespace-nowrap text-sm text-text-secondary">{company.email}</td>
                                    <td className="py-4 px-6 whitespace-nowrap text-sm text-text-secondary">
                                        {company.portalUrl && (
                                            <a href={company.portalUrl} target="_blank" rel="noopener noreferrer" title="Abrir Portal" className="text-brand-primary hover:text-brand-primary/80">
                                                <LinkIcon />
                                            </a>
                                        )}
                                    </td>
                                    <td className="py-4 px-6 whitespace-nowrap text-sm text-text-secondary">
                                        <div className="flex items-center gap-4">
                                            <button onClick={() => handleOpenModal(company)} className="text-text-secondary hover:text-brand-primary transition-colors"><EditIcon /></button>
                                            <button onClick={() => deleteInsuranceCompanyContact(company.id)} className="text-text-secondary hover:text-danger transition-colors"><TrashIcon /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredAndSortedCompanies.length === 0 && (
                    <p className="text-center text-text-muted mt-6">
                        {searchTerm ? 'Nenhuma seguradora encontrada.' : 'Nenhuma seguradora cadastrada.'}
                    </p>
                )}

                <InsuranceCompanyModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    onSubmit={handleSubmit}
                    company={editingCompany}
                />
            </div>
        </div>
    );
};

export default InsuranceCompanies;