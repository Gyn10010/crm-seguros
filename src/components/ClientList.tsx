import React, { useState, useEffect, useMemo } from 'react';
import { Client } from '../types/index';
import { LDRState } from '../hooks/useLDRState';
import { EditIcon, TrashIcon, ArrowUpIcon, ArrowDownIcon } from './icons/Icons';
import { Search, Settings, Upload } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ClientFieldsConfig } from './ClientFieldsConfig';
import { ImportClients } from './ImportClients';
import { supabase } from '@/integrations/supabase/client';


interface ClientListProps {
    ldrState: LDRState;
}

interface ClientFormData {
    name: string;
    email: string;
    phone: string;
    address: string;
    personType?: 'Física' | 'Jurídica';
    city?: string;
    state?: string;
    zipCode?: string;
    document?: string;
    salesperson?: string;
    birthDate?: string;
    businessSector?: string;
    monthlyIncome?: number;
    licenseExpiry?: string;
    isActive?: boolean;
    maritalStatus?: string;
    profession?: string;
    gender?: 'Masculino' | 'Feminino' | 'Outro' | 'Prefiro não informar';
}

const ClientModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (clientData: ClientFormData) => void;
    client: Client | null;
    users: any[];
    userId: string;
}> = ({ isOpen, onClose, onSubmit, client, users, userId }) => {
    const [formData, setFormData] = useState<ClientFormData>({
        name: '',
        email: '',
        phone: '',
        address: '',
        personType: 'Física',
        isActive: true,
    });
    const [fieldConfigs, setFieldConfigs] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (client) {
            setFormData({
                name: client.name,
                email: client.email,
                phone: client.phone,
                address: client.address,
                personType: client.personType || 'Física',
                city: client.city || '',
                state: client.state || '',
                zipCode: client.zipCode || '',
                document: client.document || '',
                salesperson: client.salesperson || '',
                birthDate: client.birthDate || '',
                businessSector: client.businessSector || '',
                monthlyIncome: client.monthlyIncome || undefined,
                licenseExpiry: client.licenseExpiry || '',
                isActive: client.isActive !== undefined ? client.isActive : true,
                maritalStatus: client.maritalStatus || '',
                profession: client.profession || '',
                gender: client.gender || undefined,
            });
        } else {
            setFormData({
                name: '',
                email: '',
                phone: '',
                address: '',
                personType: 'Física',
                isActive: true,
            });
        }
    }, [client, isOpen]);

    useEffect(() => {
        // Mock field configs for now
        setFieldConfigs({});
    }, [isOpen, userId]);

    const handleChange = (field: string, value: any) => {
        setFormData({ ...formData, [field]: value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
        onClose();
    };

    const calculateAge = (birthDate: string) => {
        if (!birthDate) return '';
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age > 0 ? `${age} anos` : '';
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl">{client ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <Tabs defaultValue="basic" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="basic">Dados Básicos</TabsTrigger>
                            <TabsTrigger value="personal">Dados Pessoais</TabsTrigger>
                            <TabsTrigger value="professional">Dados Profissionais</TabsTrigger>
                        </TabsList>

                        <TabsContent value="basic" className="space-y-4 mt-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nome Completo</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => handleChange('name', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="personType">Tipo de Pessoa</Label>
                                    <Select value={formData.personType} onValueChange={(value) => handleChange('personType', value)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Física">Física</SelectItem>
                                            <SelectItem value="Jurídica">Jurídica</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => handleChange('email', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Telefone</Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => handleChange('phone', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="document">{formData.personType === 'Física' ? 'CPF' : 'CNPJ'}</Label>
                                <Input
                                    id="document"
                                    value={formData.document}
                                    onChange={(e) => handleChange('document', e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="address">Endereço</Label>
                                <Textarea
                                    id="address"
                                    value={formData.address}
                                    onChange={(e) => handleChange('address', e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="zipCode">CEP</Label>
                                    <Input
                                        id="zipCode"
                                        value={formData.zipCode}
                                        onChange={(e) => handleChange('zipCode', e.target.value)}
                                        placeholder="00000-000"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="city">Cidade</Label>
                                    <Input
                                        id="city"
                                        value={formData.city}
                                        onChange={(e) => handleChange('city', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="state">Estado</Label>
                                    <Input
                                        id="state"
                                        value={formData.state}
                                        onChange={(e) => handleChange('state', e.target.value)}
                                        maxLength={2}
                                        placeholder="UF"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="isActive"
                                    checked={formData.isActive}
                                    onCheckedChange={(checked) => handleChange('isActive', checked)}
                                />
                                <Label htmlFor="isActive">Cliente Ativo</Label>
                            </div>
                        </TabsContent>

                        <TabsContent value="personal" className="space-y-4 mt-4">
                            {formData.personType === 'Física' && (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="birthDate">Data de Nascimento</Label>
                                            <Input
                                                id="birthDate"
                                                type="date"
                                                value={formData.birthDate}
                                                onChange={(e) => handleChange('birthDate', e.target.value)}
                                            />
                                            {formData.birthDate && (
                                                <p className="text-sm text-muted-foreground">
                                                    Idade: {calculateAge(formData.birthDate)}
                                                </p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="gender">Sexo</Label>
                                            <Select value={formData.gender} onValueChange={(value) => handleChange('gender', value)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Masculino">Masculino</SelectItem>
                                                    <SelectItem value="Feminino">Feminino</SelectItem>
                                                    <SelectItem value="Outro">Outro</SelectItem>
                                                    <SelectItem value="Prefiro não informar">Prefiro não informar</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="maritalStatus">Estado Civil</Label>
                                            <Select value={formData.maritalStatus} onValueChange={(value) => handleChange('maritalStatus', value)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Solteiro(a)">Solteiro(a)</SelectItem>
                                                    <SelectItem value="Casado(a)">Casado(a)</SelectItem>
                                                    <SelectItem value="Divorciado(a)">Divorciado(a)</SelectItem>
                                                    <SelectItem value="Viúvo(a)">Viúvo(a)</SelectItem>
                                                    <SelectItem value="União Estável">União Estável</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="licenseExpiry">Vencimento CNH</Label>
                                            <Input
                                                id="licenseExpiry"
                                                type="date"
                                                value={formData.licenseExpiry}
                                                onChange={(e) => handleChange('licenseExpiry', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </>
                            )}
                        </TabsContent>

                        <TabsContent value="professional" className="space-y-4 mt-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="profession">Profissão</Label>
                                    <Input
                                        id="profession"
                                        value={formData.profession}
                                        onChange={(e) => handleChange('profession', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="businessSector">Ramo</Label>
                                    <Input
                                        id="businessSector"
                                        value={formData.businessSector}
                                        onChange={(e) => handleChange('businessSector', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="monthlyIncome">Renda Mensal</Label>
                                    <Input
                                        id="monthlyIncome"
                                        type="number"
                                        step="0.01"
                                        value={formData.monthlyIncome || ''}
                                        onChange={(e) => handleChange('monthlyIncome', e.target.value ? parseFloat(e.target.value) : undefined)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="salesperson">Vendedor</Label>
                                    <Select value={formData.salesperson} onValueChange={(value) => handleChange('salesperson', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {users.map((user) => (
                                                <SelectItem key={user.id} value={user.name}>
                                                    {user.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>

                    <div className="flex justify-end gap-4 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button type="submit">
                            {client ? 'Salvar Alterações' : 'Adicionar Cliente'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};


const ClientList: React.FC<ClientListProps> = ({ ldrState }) => {
    const { clients, policies, users, addClient, updateClient, deleteClient, systemSettings } = ldrState;
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [showFieldConfig, setShowFieldConfig] = useState(false);
    const [showImportCSV, setShowImportCSV] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string>('');

    useEffect(() => {
        const getCurrentUser = async () => {
            try {
                // Try to get user from Supabase auth with timeout
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Auth timeout')), 3000)
                );

                const authPromise = supabase.auth.getUser();

                const { data: { user }, error } = await Promise.race([
                    authPromise,
                    timeoutPromise
                ]) as any;

                if (error) throw error;

                if (user) {
                    console.log('User authenticated:', user.id);
                    setCurrentUserId(user.id);
                } else {
                    console.warn('No authenticated user found, using fallback');
                    // Fallback: try to get from session
                    const { data: { session } } = await supabase.auth.getSession();
                    if (session?.user) {
                        setCurrentUserId(session.user.id);
                    } else {
                        // Last resort: use a mock ID for development
                        setCurrentUserId('mock-user-id');
                    }
                }
            } catch (error) {
                console.error('Error getting current user:', error);
                // Fallback: try to get from session
                try {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (session?.user) {
                        console.log('Using session user:', session.user.id);
                        setCurrentUserId(session.user.id);
                    } else {
                        console.warn('No session found, using mock ID');
                        setCurrentUserId('mock-user-id');
                    }
                } catch (sessionError) {
                    console.error('Error getting session:', sessionError);
                    setCurrentUserId('mock-user-id');
                }
            }
        };
        getCurrentUser();
    }, []);

    const clientsWithStats = useMemo(() => {
        return clients.map(client => {
            const clientPolicies = policies.filter(p => p.clientId === client.id);
            const policyCount = clientPolicies.length;
            const totalCommission = clientPolicies.reduce((acc, policy) => {
                return acc + (policy.premium * (policy.commission / 100));
            }, 0);

            const age = client.birthDate ? (() => {
                const today = new Date();
                const birth = new Date(client.birthDate);
                let age = today.getFullYear() - birth.getFullYear();
                const monthDiff = today.getMonth() - birth.getMonth();
                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
                    age--;
                }
                return age;
            })() : null;

            return {
                ...client,
                policyCount,
                totalCommission,
                age,
            };
        });
    }, [clients, policies]);

    const [sortConfig, setSortConfig] = useState<{ key: string; direction: string } | null>({ key: 'createdAt', direction: 'descending' });

    const filteredClients = useMemo(() => clientsWithStats.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.phone && client.phone.includes(searchTerm)) ||
        (client.city && client.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (client.document && client.document.includes(searchTerm))
    ), [clientsWithStats, searchTerm]);

    const sortedClients = useMemo(() => {
        let sortableItems = [...filteredClients];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                const keyA = a[sortConfig.key as keyof typeof a];
                const keyB = b[sortConfig.key as keyof typeof b];
                if (keyA == null) return 1;
                if (keyB == null) return -1;
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
    }, [filteredClients, sortConfig]);

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

    const handleOpenModal = (client: Client | null = null) => {
        setEditingClient(client);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setEditingClient(null);
        setIsModalOpen(false);
    };

    const handleSubmit = (clientData: ClientFormData) => {
        if (editingClient) {
            updateClient({ ...editingClient, ...clientData });
        } else {
            addClient(clientData);
        }
        handleCloseModal();
    };

    return (
        <div className="space-y-6">
            <div className="bg-ui-card p-6 rounded-lg border border-ui-border shadow-sm">
                <div className="flex justify-between items-center mb-6 gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                            type="text"
                            placeholder="Buscar por nome, email, telefone, cidade..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setShowFieldConfig(!showFieldConfig)}>
                            <Settings className="h-4 w-4 mr-2" />
                            Configurar Campos
                        </Button>
                        <Button variant="outline" onClick={() => setShowImportCSV(!showImportCSV)}>
                            <Upload className="h-4 w-4 mr-2" />
                            Importar CSV
                        </Button>
                        <Button onClick={() => handleOpenModal()}>
                            + Novo Cliente
                        </Button>
                    </div>
                </div>

                {showFieldConfig && currentUserId && (
                    <div className="mb-6">
                        <ClientFieldsConfig userId={currentUserId} />
                    </div>
                )}

                {showImportCSV && (
                    <div className="mb-6">
                        <ImportClients />
                    </div>
                )}

                <div className="text-sm text-muted-foreground mb-4">
                    {filteredClients.length} cliente{filteredClients.length !== 1 ? 's' : ''} encontrado{filteredClients.length !== 1 ? 's' : ''}
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr className="border-b">
                                <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    <button onClick={() => requestSort('name')} className="flex items-center hover:text-foreground">
                                        Nome {getSortIcon('name')}
                                    </button>
                                </th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    <button onClick={() => requestSort('personType')} className="flex items-center hover:text-foreground">
                                        Tipo {getSortIcon('personType')}
                                    </button>
                                </th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Email
                                </th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Telefone
                                </th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Cidade/Estado
                                </th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    <button onClick={() => requestSort('policyCount')} className="flex items-center hover:text-foreground">
                                        Apólices {getSortIcon('policyCount')}
                                    </button>
                                </th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    <button onClick={() => requestSort('totalCommission')} className="flex items-center hover:text-foreground">
                                        Comissão {getSortIcon('totalCommission')}
                                    </button>
                                </th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    <button onClick={() => requestSort('createdAt')} className="flex items-center hover:text-foreground">
                                        Cliente Desde {getSortIcon('createdAt')}
                                    </button>
                                </th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Ações
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {sortedClients.map(client => (
                                <tr key={client.id} className="hover:bg-muted/50">
                                    <td className="py-4 px-4 text-sm font-medium">{client.name}</td>
                                    <td className="py-4 px-4 text-sm">{client.personType || '-'}</td>
                                    <td className="py-4 px-4 text-sm">{client.email}</td>
                                    <td className="py-4 px-4 text-sm">{client.phone}</td>
                                    <td className="py-4 px-4 text-sm">
                                        {client.city && client.state ? `${client.city}/${client.state}` : client.city || client.state || '-'}
                                    </td>
                                    <td className="py-4 px-4 text-sm text-center">{client.policyCount}</td>
                                    <td className="py-4 px-4 text-sm">
                                        {client.totalCommission.toLocaleString('pt-BR', { style: 'currency', currency: systemSettings.currency })}
                                    </td>
                                    <td className="py-4 px-4 text-sm">
                                        {new Date(client.createdAt).toLocaleDateString('pt-BR')}
                                    </td>
                                    <td className="py-4 px-4 text-sm">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${client.isActive !== false ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {client.isActive !== false ? 'Ativo' : 'Inativo'}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4 text-sm">
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleOpenModal(client)}
                                            >
                                                <EditIcon className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => deleteClient(client.id)}
                                            >
                                                <TrashIcon className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {sortedClients.length === 0 && (
                    <p className="text-center text-muted-foreground mt-6">Nenhum cliente encontrado.</p>
                )}

                <ClientModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    onSubmit={handleSubmit}
                    client={editingClient}
                    users={users}
                    userId={currentUserId}
                />
            </div>
        </div>
    );
};

export default ClientList;