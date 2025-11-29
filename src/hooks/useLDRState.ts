import { useState, useCallback, useEffect } from 'react';
import {
  Client, Policy, PolicyType, PolicyStatus, Task, TaskStatus, TaskRecurrence,
  Renewal, RenewalStatus, User, Page, SystemSettings, InsuranceCompanyContact,
  Opportunity, DealType, FunnelActivity,
  FunnelActivityTemplate, FunnelConfiguration, FunnelStage
} from '../types/index';
import { supabase } from '@/integrations/supabase/client';

import { toast } from 'sonner';
const defaultSystemSettings: SystemSettings = {
  companyName: 'LDR Seguros',
  themeColor: '#0052CC',
  currency: 'BRL',
  renewalAlertDays: 90,
};

// --- MOCK DATA ---
const mockClients: Client[] = [
  { id: '1', name: 'Ana Silva', email: 'ana.silva@example.com', phone: '(11) 98765-4321', address: 'Rua das Flores, 123', createdAt: '2023-01-15' },
  { id: '2', name: 'Bruno Costa', email: 'bruno.costa@example.com', phone: '(21) 91234-5678', address: 'Avenida do Sol, 456', createdAt: '2023-03-22' },
];

const mockPolicies: Policy[] = [
  { id: 'p1', clientId: '1', policyNumber: 'AUT-12345', insuranceCompany: 'Porto Seguro', type: 'Automóvel', premium: 2500, commission: 15, startDate: '2024-01-01', endDate: '2025-01-01', status: PolicyStatus.Active },
  { id: 'p2', clientId: '2', policyNumber: 'RES-67890', insuranceCompany: 'Allianz', type: 'Residencial', premium: 800, commission: 20, startDate: '2024-03-15', endDate: '2025-03-15', status: PolicyStatus.Active },
  { id: 'p3', clientId: '1', policyNumber: 'VID-54321', insuranceCompany: 'Tokio Marine', type: 'Vida', premium: 1200, commission: 25, startDate: '2023-11-10', endDate: '2024-11-10', status: PolicyStatus.Pending },
];

const mockTasks: Task[] = [
  { id: 't1', title: 'Ligar para Ana Silva', description: 'Confirmar dados para renovação do seguro auto.', status: TaskStatus.ToDo, clientId: '1', dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], recurrence: TaskRecurrence.None },
  { id: 't2', title: 'Enviar cotação residencial', description: 'Cotação para o cliente Bruno Costa.', status: TaskStatus.InProgress, clientId: '2', recurrence: TaskRecurrence.None },
];

const mockRenewals: Renewal[] = mockPolicies
  .filter(p => p.status !== PolicyStatus.Canceled)
  .map(p => ({
    policyId: p.id,
    clientId: p.clientId,
    status: RenewalStatus.Pending,
    salesperson: 'Usuário Demo',
    notes: 'Aguardando contato com o cliente.',
  }));

const mockUsers: User[] = [
  { id: 'mock-user-id', name: 'Usuário Demo', email: 'demo@ldrseguros.com', role: 'Gestor', permissions: Object.values(Page) },
  { id: 'user-2', name: 'Vendedor Exemplo', email: 'vendedor@ldrseguros.com', role: 'Vendedor', permissions: [Page.Dashboard, Page.Clients, Page.Policies, Page.Tasks, Page.Renewals] },
];

const mockInsuranceCompanies: InsuranceCompanyContact[] = [
  { id: 'ic1', name: 'Porto Seguro', contactPerson: 'Carlos Mendes', phone: '0800 727 2766', email: 'carlos.mendes@portoseguro.com.br', credentials: [], portalUrl: 'https://www.portoseguro.com.br/' },
  { id: 'ic2', name: 'Allianz', contactPerson: 'Sofia Andrade', phone: '0800 777 7243', email: 'sofia.andrade@allianz.com.br', credentials: [], portalUrl: 'https://www.allianz.com.br/' },
  { id: 'ic3', name: 'Tokio Marine', contactPerson: 'Ricardo Lima', phone: '0800 703 9000', email: 'ricardo.lima@tokiomarine.com.br', credentials: [], portalUrl: 'https://www.tokiomarine.com.br/' },
];

const mockFunnelConfigurations: FunnelConfiguration[] = [
  { id: 'fc1', funnelName: 'Vendas', funnelKey: 'sales', isActive: true, orderIndex: 0 },
  { id: 'fc2', funnelName: 'Renovação', funnelKey: 'renewal', isActive: true, orderIndex: 1 },
];

const mockFunnelStages: FunnelStage[] = [
  { id: 'fs1', funnelKey: 'sales', stageName: 'Lead', stageKey: 'lead', orderIndex: 0 },
  { id: 'fs2', funnelKey: 'sales', stageName: 'Proposta', stageKey: 'proposal', orderIndex: 1 },
  { id: 'fs3', funnelKey: 'sales', stageName: 'Negociação', stageKey: 'negotiation', orderIndex: 2 },
  { id: 'fs4', funnelKey: 'sales', stageName: 'Fechamento', stageKey: 'closing', orderIndex: 3 },
  { id: 'fs5', funnelKey: 'renewal', stageName: 'Novo', stageKey: 'new', orderIndex: 0 },
  { id: 'fs6', funnelKey: 'renewal', stageName: 'Em Andamento', stageKey: 'in_progress', orderIndex: 1 },
  { id: 'fs7', funnelKey: 'renewal', stageName: 'Concluído', stageKey: 'completed', orderIndex: 2 },
];

const mockFunnelActivityTemplates: FunnelActivityTemplate[] = [
  { id: 't1', funnelType: 'sales', stage: 'lead', activityText: 'Primeiro contato com o cliente', orderIndex: 0 },
  { id: 't2', funnelType: 'sales', stage: 'lead', activityText: 'Qualificação das necessidades', orderIndex: 1 },
  { id: 't3', funnelType: 'sales', stage: 'proposal', activityText: 'Enviar cotação', orderIndex: 0 },
  { id: 't4', funnelType: 'sales', stage: 'proposal', activityText: 'Apresentar proposta', orderIndex: 1 },
  { id: 't5', funnelType: 'renewal', stage: 'new', activityText: 'Contatar cliente para renovação', orderIndex: 0 },
  { id: 't6', funnelType: 'renewal', stage: 'new', activityText: 'Verificar dados atualizados', orderIndex: 1 },
];

const mockOpportunities: Opportunity[] = [
  {
    id: 'opp1',
    funnelType: 'new_sales',
    stage: 'Prospecção',
    title: 'Ana Silva - Automóvel - Novo',
    clientId: '1',
    value: 2500,
    commission: 15,
    expectedCloseDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dealType: DealType.New,
    salesperson: 'Usuário Demo',
    origin: 'Indicação',
    technicalResponsible: 'Usuário Demo',
    renewalResponsible: 'Usuário Demo',
    insuranceType: 'Automóvel',
    insuranceCompany: 'Porto Seguro',
    activities: [
      { id: 'act1', text: 'Primeiro contato com cliente', stage: 'Prospecção', completed: true, assignedTo: 'mock-user-id' },
      { id: 'act2', text: 'Coletar dados para cotação', stage: 'Prospecção', completed: false, assignedTo: 'mock-user-id' }
    ],
    createdAt: new Date().toISOString().split('T')[0],
  },
  {
    id: 'opp2',
    funnelType: 'new_sales',
    stage: 'Proposta',
    title: 'Bruno Costa - Residencial - Novo',
    clientId: '2',
    value: 800,
    commission: 20,
    expectedCloseDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dealType: DealType.New,
    salesperson: 'Vendedor Exemplo',
    origin: 'Website',
    technicalResponsible: 'Vendedor Exemplo',
    renewalResponsible: 'Vendedor Exemplo',
    insuranceType: 'Residencial',
    insuranceCompany: 'Allianz',
    activities: [],
    createdAt: new Date().toISOString().split('T')[0],
  },
  {
    id: 'opp3',
    funnelType: 'new_sales',
    stage: 'Fechado Ganho',
    title: 'Ana Silva - Vida - Novo',
    clientId: '1',
    value: 1200,
    commission: 25,
    expectedCloseDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dealType: DealType.New,
    salesperson: 'Usuário Demo',
    origin: 'Indicação',
    technicalResponsible: 'Usuário Demo',
    renewalResponsible: 'Usuário Demo',
    insuranceType: 'Vida',
    insuranceCompany: 'Tokio Marine',
    activities: [],
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  },
];


// --- INTERFACE ---
export interface LDRState {
  clients: Client[];
  policies: Policy[];
  tasks: Task[];
  renewals: Renewal[];
  users: User[];
  opportunities: Opportunity[];
  origins: string[];
  policyTypes: string[];
  insuranceCompanyContacts: InsuranceCompanyContact[];
  funnelActivityTemplates: FunnelActivityTemplate[];
  funnelConfigurations: FunnelConfiguration[];
  funnelStages: FunnelStage[];
  systemSettings: SystemSettings;
  addClient: (client: Omit<Client, 'id' | 'createdAt'>) => void;
  updateClient: (client: Client) => void;
  deleteClient: (clientId: string) => void;
  addPolicy: (policy: Omit<Policy, 'id'>) => void;
  updatePolicy: (policy: Policy) => void;
  deletePolicy: (policyId: string) => void;
  addTask: (task: Omit<Task, 'id' | 'status'>) => void;
  updateTaskStatus: (taskId: string, newStatus: TaskStatus) => void;
  updateTask: (task: Task) => void;
  updateRenewal: (updatedRenewal: Renewal) => void;
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (user: User) => void;
  deleteUser: (userId: string) => void;
  refreshUsers: () => Promise<void>;
  addOrigin: (origin: string) => void;
  deleteOrigin: (origin: string) => void;
  updateSystemSettings: (settings: Partial<SystemSettings>) => void;
  addPolicyType: (policyType: string) => void;
  deletePolicyType: (policyType: string) => void;
  addInsuranceCompanyContact: (company: Omit<InsuranceCompanyContact, 'id'>) => void;
  updateInsuranceCompanyContact: (company: InsuranceCompanyContact) => void;
  deleteInsuranceCompanyContact: (companyId: string) => void;
  addOpportunity: (opportunityData: Omit<Opportunity, 'id' | 'createdAt' | 'stage' | 'activities'>) => void;
  updateOpportunity: (opportunity: Opportunity) => void;
  deleteOpportunity: (opportunityId: string) => void;
  updateOpportunityStage: (opportunityId: string, newStage: string) => void;
  addFunnelActivity: (opportunityId: string, activityData: Omit<FunnelActivity, 'id'>) => void;
  updateFunnelActivity: (opportunityId: string, updatedActivity: FunnelActivity) => void;
  addFunnelActivityTemplate: (template: Omit<FunnelActivityTemplate, 'id' | 'orderIndex'>) => void;
  updateFunnelActivityTemplate: (template: FunnelActivityTemplate) => void;
  deleteFunnelActivityTemplate: (templateId: string) => void;
  moveFunnelActivityTemplate: (templateId: string, direction: 'up' | 'down') => void;
  addFunnelConfiguration: (funnelName: string) => void;
  updateFunnelConfiguration: (funnel: FunnelConfiguration) => void;
  deleteFunnelConfiguration: (funnelId: string) => void;
  moveFunnelConfiguration: (funnelId: string, direction: 'up' | 'down') => void;
  addFunnelStage: (funnelKey: string, stageName: string) => void;
  updateFunnelStage: (stage: FunnelStage) => void;
  deleteFunnelStage: (stageId: string) => void;
  moveFunnelStage: (stageId: string, direction: 'up' | 'down') => void;
}

const useLDRState = (): LDRState => {
  const [clients, setClients] = useState<Client[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [renewals, setRenewals] = useState<Renewal[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [insuranceCompanyContacts, setInsuranceCompanyContacts] = useState<InsuranceCompanyContact[]>([]);
  const [funnelActivityTemplates, setFunnelActivityTemplates] = useState<FunnelActivityTemplate[]>([]);
  const [funnelConfigurations, setFunnelConfigurations] = useState<FunnelConfiguration[]>([]);
  const [funnelStages, setFunnelStages] = useState<FunnelStage[]>([]);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(defaultSystemSettings);
  const [origins, setOrigins] = useState<string[]>([]);
  const [policyTypes, setPolicyTypes] = useState<string[]>([]);

  // Load all data from Supabase
  useEffect(() => {
    const loadAllData = async () => {
      try {
        // Load clients
        const { data: clientsData, error: clientsError } = await supabase.from('clients').select('*');
        if (clientsError) throw clientsError;
        if (clientsData) {
          setClients(clientsData.map(c => ({
            id: c.id,
            name: c.name,
            email: c.email,
            phone: c.phone,
            address: c.address || '',
            createdAt: c.created_at,
            personType: c.person_type as 'Física' | 'Jurídica' | undefined,
            city: c.city || undefined,
            state: c.state || undefined,
            zipCode: c.zip_code || undefined,
            document: c.document || undefined,
            salesperson: c.salesperson || undefined,
            birthDate: c.birth_date || undefined,
            businessSector: c.business_sector || undefined,
            monthlyIncome: c.monthly_income || undefined,
            licenseExpiry: c.license_expiry || undefined,
            isActive: c.is_active || undefined,
            maritalStatus: c.marital_status || undefined,
            profession: c.profession || undefined,
            gender: c.gender as 'Masculino' | 'Feminino' | 'Outro' | 'Prefiro não informar' | undefined,
          })));
        }

        // Load policies
        const { data: policiesData, error: policiesError } = await supabase.from('policies').select('*');
        if (policiesError) throw policiesError;
        if (policiesData) {
          setPolicies(policiesData.map(p => ({
            id: p.id,
            clientId: p.client_id,
            policyNumber: p.policy_number,
            insuranceCompany: p.insurance_company,
            type: p.type,
            premium: p.premium,
            commission: p.commission,
            startDate: p.start_date,
            endDate: p.end_date,
            status: p.status as PolicyStatus,
            documentType: p.document_type || undefined,
            netPremium: p.net_premium || undefined,
            generatedCommission: p.generated_commission || undefined,
            installments: p.installments || undefined,
            paymentType: p.payment_type || undefined,
            branch: p.branch || undefined,
            product: p.product || undefined,
            item: p.item || undefined,
            proposal: p.proposal || undefined,
            endorsementProposal: p.endorsement_proposal || undefined,
            endorsement: p.endorsement || undefined,
            sellerTransfer: p.seller_transfer || undefined,
          })));
        }

        // Load tasks
        const { data: tasksData, error: tasksError } = await supabase.from('tasks').select('*');
        if (tasksError) throw tasksError;
        if (tasksData) {
          setTasks(tasksData.map(t => ({
            id: t.id,
            title: t.title,
            description: t.description || '',
            status: t.status as TaskStatus,
            clientId: t.client_id || undefined,
            opportunityId: t.opportunity_id || undefined,
            dueDate: t.due_date || undefined,
            recurrence: t.recurrence as TaskRecurrence,
            userId: t.user_id || undefined,
          })));
        }

        // Load renewals
        const { data: renewalsData, error: renewalsError } = await supabase.from('renewals').select('*');
        if (renewalsError) throw renewalsError;
        if (renewalsData) {
          setRenewals(renewalsData.map(r => ({
            policyId: r.policy_id,
            clientId: r.client_id,
            status: r.status as RenewalStatus,
            salesperson: r.salesperson,
            nextContactDate: r.next_contact_date || undefined,
            notes: r.notes || undefined,
          })));
        }

        // Load insurance companies
        const { data: insuranceData, error: insuranceError } = await supabase.from('insurance_companies').select('*, credentials(*)');
        if (insuranceError) throw insuranceError;
        if (insuranceData) {
          setInsuranceCompanyContacts(insuranceData.map(ic => ({
            id: ic.id,
            name: ic.name,
            contactPerson: ic.contact_person,
            phone: ic.phone,
            email: ic.email,
            portalUrl: ic.portal_url || undefined,
            credentials: ic.credentials.map((c: any) => ({
              id: c.id,
              systemName: c.system_name,
              login: c.login,
              // Password is not returned for security, or encrypted. 
              // The type expects password? string. We might need to handle this.
              // For now, let's assume it's handled or not needed for display.
            })),
          })));
        }

        // Load opportunities
        const { data: opportunitiesData, error: opportunitiesError } = await supabase.from('opportunities').select('*, funnel_activities(*)');
        if (opportunitiesError) throw opportunitiesError;
        if (opportunitiesData) {
          setOpportunities(opportunitiesData.map(o => ({
            id: o.id,
            funnelType: o.funnel_type,
            stage: o.stage,
            title: o.title,
            clientId: o.client_id,
            value: o.value,
            commission: o.commission,
            expectedCloseDate: o.expected_close_date,
            dealType: o.deal_type as DealType,
            salesperson: o.salesperson,
            origin: o.origin,
            technicalResponsible: o.technical_responsible,
            renewalResponsible: o.renewal_responsible,
            insuranceType: o.insurance_type,
            insuranceCompany: o.insurance_company,
            notes: o.notes || undefined,
            createdAt: o.created_at,
            activities: o.funnel_activities.map((fa: any) => ({
              id: fa.id,
              text: fa.text,
              stage: fa.stage,
              completed: fa.completed,
              assignedTo: fa.assigned_to,
              dueDate: fa.due_date || undefined,
              dueTime: fa.due_time || undefined,
            })),
          })));
        }

        // Load origins
        const { data: originsData, error: originsError } = await supabase.from('origins').select('name');
        if (originsError) throw originsError;
        if (originsData) {
          setOrigins(originsData.map(o => o.name));
        }

        // Load policy types
        const { data: policyTypesData, error: policyTypesError } = await supabase.from('policy_types').select('name');
        if (policyTypesError) throw policyTypesError;
        if (policyTypesData) {
          setPolicyTypes(policyTypesData.map(pt => pt.name));
        }

        // Load profiles (users)
        const { data: profilesData, error: profilesError } = await supabase.from('profiles').select('*');
        if (profilesError) throw profilesError;
        if (profilesData) {
          setUsers(profilesData.map(p => ({
            id: p.id,
            name: p.name,
            email: p.email,
            role: (p.role === 'Gestor' || p.role === 'Vendedor') ? p.role : 'Vendedor',
            permissions: [], // Permissions logic might need to be revisited
            avatarUrl: p.avatar_url || undefined,
          })));
        }

        // Load funnel configs, stages, templates...
        const { data: funnelConfigsData } = await supabase.from('funnel_configurations').select('*');
        if (funnelConfigsData) {
          setFunnelConfigurations(funnelConfigsData.map(fc => ({
            id: fc.id,
            funnelName: fc.funnel_name,
            funnelKey: fc.funnel_key,
            isActive: fc.is_active,
            orderIndex: fc.order_index,
          })));
        }

        // Initialize default funnels if none exist
        if (!funnelConfigsData || funnelConfigsData.length === 0) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const defaultFunnels = [
              { funnel_name: 'Vendas', funnel_key: 'new_sales', is_active: true, order_index: 0, user_id: user.id },
              { funnel_name: 'Renovação', funnel_key: 'renewal', is_active: true, order_index: 1, user_id: user.id },
              { funnel_name: 'Pós-Vendas', funnel_key: 'post_sales', is_active: true, order_index: 2, user_id: user.id },
              { funnel_name: 'Endosso', funnel_key: 'endorsement', is_active: true, order_index: 3, user_id: user.id },
              { funnel_name: 'Sinistro', funnel_key: 'claim', is_active: true, order_index: 4, user_id: user.id },
              { funnel_name: 'Acompanhamento de Parcelas', funnel_key: 'installment_follow_up', is_active: true, order_index: 5, user_id: user.id },
            ];

            const { data: insertedFunnels, error: funnelInsertError } = await supabase
              .from('funnel_configurations')
              .insert(defaultFunnels)
              .select();

            if (funnelInsertError) {
              console.error('Error inserting default funnels:', funnelInsertError);
            } else if (insertedFunnels) {
              // Create default stages for each funnel
              const defaultStages = [
                // Vendas stages
                { funnel_key: 'new_sales', stage_name: 'Prospecção', stage_key: 'prospect', order_index: 0, user_id: user.id },
                { funnel_key: 'new_sales', stage_name: 'Qualificação', stage_key: 'qualification', order_index: 1, user_id: user.id },
                { funnel_key: 'new_sales', stage_name: 'Proposta', stage_key: 'proposal', order_index: 2, user_id: user.id },
                { funnel_key: 'new_sales', stage_name: 'Negociação', stage_key: 'negotiation', order_index: 3, user_id: user.id },
                { funnel_key: 'new_sales', stage_name: 'Fechado Ganho', stage_key: 'closed_won', order_index: 4, user_id: user.id },

                // Renovação stages
                { funnel_key: 'renewal', stage_name: 'Cálculo', stage_key: 'calculation', order_index: 0, user_id: user.id },
                { funnel_key: 'renewal', stage_name: 'Apresentação', stage_key: 'presentation', order_index: 1, user_id: user.id },
                { funnel_key: 'renewal', stage_name: 'Negociação', stage_key: 'negotiation', order_index: 2, user_id: user.id },
                { funnel_key: 'renewal', stage_name: 'Fechado Ganho', stage_key: 'closed_won', order_index: 3, user_id: user.id },
                { funnel_key: 'renewal', stage_name: 'Fechado Perdido', stage_key: 'closed_lost', order_index: 4, user_id: user.id },

                // Pós-Vendas stages
                { funnel_key: 'post_sales', stage_name: 'Emissão', stage_key: 'issuance', order_index: 0, user_id: user.id },
                { funnel_key: 'post_sales', stage_name: 'Entrega', stage_key: 'delivery', order_index: 1, user_id: user.id },
                { funnel_key: 'post_sales', stage_name: 'Finalizado', stage_key: 'finished', order_index: 2, user_id: user.id },

                // Endosso stages
                { funnel_key: 'endorsement', stage_name: 'Solicitação', stage_key: 'request', order_index: 0, user_id: user.id },
                { funnel_key: 'endorsement', stage_name: 'Análise', stage_key: 'analysis', order_index: 1, user_id: user.id },
                { funnel_key: 'endorsement', stage_name: 'Emissão', stage_key: 'issuance', order_index: 2, user_id: user.id },

                // Sinistro stages
                { funnel_key: 'claim', stage_name: 'Aviso de Sinistro', stage_key: 'notice', order_index: 0, user_id: user.id },
                { funnel_key: 'claim', stage_name: 'Envio Documentação', stage_key: 'documentation', order_index: 1, user_id: user.id },
                { funnel_key: 'claim', stage_name: 'Análise', stage_key: 'analysis', order_index: 2, user_id: user.id },
                { funnel_key: 'claim', stage_name: 'Pagamento', stage_key: 'payment', order_index: 3, user_id: user.id },
                { funnel_key: 'claim', stage_name: 'Finalizado', stage_key: 'finished', order_index: 4, user_id: user.id },

                // Acompanhamento de Parcelas stages
                { funnel_key: 'installment_follow_up', stage_name: 'Pendente', stage_key: 'pending', order_index: 0, user_id: user.id },
                { funnel_key: 'installment_follow_up', stage_name: 'Contatado', stage_key: 'contacted', order_index: 1, user_id: user.id },
                { funnel_key: 'installment_follow_up', stage_name: 'Pago', stage_key: 'paid', order_index: 2, user_id: user.id },
                { funnel_key: 'installment_follow_up', stage_name: 'Vencido', stage_key: 'overdue', order_index: 3, user_id: user.id },
              ];

              const { error: stagesInsertError } = await supabase
                .from('funnel_stages')
                .insert(defaultStages);

              if (stagesInsertError) {
                console.error('Error inserting default stages:', stagesInsertError);
              }

              // Reload funnel data
              const { data: reloadedFunnels } = await supabase.from('funnel_configurations').select('*');
              if (reloadedFunnels) {
                setFunnelConfigurations(reloadedFunnels.map(fc => ({
                  id: fc.id,
                  funnelName: fc.funnel_name,
                  funnelKey: fc.funnel_key,
                  isActive: fc.is_active,
                  orderIndex: fc.order_index,
                })));
              }

              const { data: reloadedStages } = await supabase.from('funnel_stages').select('*');
              if (reloadedStages) {
                setFunnelStages(reloadedStages.map(fs => ({
                  id: fs.id,
                  funnelKey: fs.funnel_key,
                  stageName: fs.stage_name,
                  stageKey: fs.stage_key,
                  orderIndex: fs.order_index,
                })));
              }
            }
          }
        } else {
          // Load existing stages
          const { data: funnelStagesData } = await supabase.from('funnel_stages').select('*');
          if (funnelStagesData) {
            setFunnelStages(funnelStagesData.map(fs => ({
              id: fs.id,
              funnelKey: fs.funnel_key,
              stageName: fs.stage_name,
              stageKey: fs.stage_key,
              orderIndex: fs.order_index,
            })));
          }
        }

        const { data: activityTemplatesData } = await supabase.from('funnel_activity_templates').select('*');
        if (activityTemplatesData) {
          setFunnelActivityTemplates(activityTemplatesData.map(at => ({
            id: at.id,
            funnelType: at.funnel_type,
            stage: at.stage,
            activityText: at.activity_text,
            orderIndex: at.order_index,
          })));
        }


      } catch (error) {
        console.error("Error loading data from Supabase:", error);
        toast.error("Erro ao carregar dados.");
      }
    };

    loadAllData();
  }, []);

  const addClient = useCallback(async (clientData: Omit<Client, 'id' | 'createdAt'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Usuário não autenticado');
        return;
      }

      const { data, error } = await supabase
        .from('clients')
        .insert({
          name: clientData.name,
          email: clientData.email,
          phone: clientData.phone,
          address: clientData.address,
          person_type: clientData.personType,
          city: clientData.city,
          state: clientData.state,
          zip_code: clientData.zipCode,
          document: clientData.document,
          salesperson: clientData.salesperson,
          birth_date: clientData.birthDate,
          business_sector: clientData.businessSector,
          monthly_income: clientData.monthlyIncome,
          license_expiry: clientData.licenseExpiry,
          is_active: clientData.isActive,
          marital_status: clientData.maritalStatus,
          profession: clientData.profession,
          gender: clientData.gender,
          user_id: user.id,
        })
        .select()
        .single();

      if (data && !error) {
        const newClient: Client = {
          id: data.id,
          name: data.name,
          email: data.email,
          phone: data.phone,
          address: data.address || '',
          createdAt: data.created_at,
          personType: data.person_type as 'Física' | 'Jurídica' | undefined,
          city: data.city || undefined,
          state: data.state || undefined,
          zipCode: data.zip_code || undefined,
          document: data.document || undefined,
          salesperson: data.salesperson || undefined,
          birthDate: data.birth_date || undefined,
          businessSector: data.business_sector || undefined,
          monthlyIncome: data.monthly_income || undefined,
          licenseExpiry: data.license_expiry || undefined,
          isActive: data.is_active || undefined,
          maritalStatus: data.marital_status || undefined,
          profession: data.profession || undefined,
          gender: data.gender as 'Masculino' | 'Feminino' | 'Outro' | 'Prefiro não informar' | undefined,
        };
        setClients(prev => [...prev, newClient]);
        toast.success('Cliente adicionado com sucesso!');
      } else if (error) {
        console.error('Error adding client:', error);
        toast.error('Erro ao adicionar cliente: ' + error.message);
      }
    } catch (error) {
      console.error('Error adding client:', error);
      toast.error('Erro ao adicionar cliente.');
    }
  }, []);

  const updateClient = useCallback(async (updatedClient: Client) => {
    const { error } = await supabase
      .from('clients')
      .update({
        name: updatedClient.name,
        email: updatedClient.email,
        phone: updatedClient.phone,
        address: updatedClient.address,
        person_type: updatedClient.personType,
        city: updatedClient.city,
        state: updatedClient.state,
        zip_code: updatedClient.zipCode,
        document: updatedClient.document,
        salesperson: updatedClient.salesperson,
        birth_date: updatedClient.birthDate,
        business_sector: updatedClient.businessSector,
        monthly_income: updatedClient.monthlyIncome,
        license_expiry: updatedClient.licenseExpiry,
        is_active: updatedClient.isActive,
        marital_status: updatedClient.maritalStatus,
        profession: updatedClient.profession,
        gender: updatedClient.gender,
      })
      .eq('id', updatedClient.id);

    if (!error) {
      setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
    }
  }, []);

  const deleteClient = useCallback(async (clientId: string) => {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', clientId);

    if (!error) {
      setClients(prev => prev.filter(c => c.id !== clientId));
      setPolicies(prev => prev.filter(p => p.clientId !== clientId));
    }
  }, []);

  const addPolicy = useCallback(async (policyData: Omit<Policy, 'id'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('policies')
      .insert({
        client_id: policyData.clientId,
        policy_number: policyData.policyNumber,
        insurance_company: policyData.insuranceCompany,
        document_type: policyData.documentType,
        net_premium: policyData.netPremium,
        generated_commission: policyData.generatedCommission,
        installments: policyData.installments,
        payment_type: policyData.paymentType,
        branch: policyData.branch,
        product: policyData.product,
        item: policyData.item,
        proposal: policyData.proposal,
        endorsement_proposal: policyData.endorsementProposal,
        endorsement: policyData.endorsement,
        seller_transfer: policyData.sellerTransfer,
        type: policyData.type,
        premium: policyData.premium,
        commission: policyData.commission,
        start_date: policyData.startDate,
        end_date: policyData.endDate,
        status: policyData.status,
        user_id: user.id,
      })
      .select()
      .single();

    if (data && !error) {
      const newPolicy: Policy = {
        id: data.id,
        clientId: data.client_id,
        policyNumber: data.policy_number,
        insuranceCompany: data.insurance_company,
        type: data.type,
        premium: typeof data.premium === 'string' ? parseFloat(data.premium) : data.premium,
        commission: typeof data.commission === 'string' ? parseFloat(data.commission) : data.commission,
        startDate: data.start_date,
        endDate: data.end_date,
        status: data.status as PolicyStatus,
      };
      setPolicies(prev => [...prev, newPolicy]);
    }
  }, []);

  const updatePolicy = useCallback(async (updatedPolicy: Policy) => {
    const { error } = await supabase
      .from('policies')
      .update({
        client_id: updatedPolicy.clientId,
        policy_number: updatedPolicy.policyNumber,
        insurance_company: updatedPolicy.insuranceCompany,
        type: updatedPolicy.type,
        premium: updatedPolicy.premium,
        commission: updatedPolicy.commission,
        start_date: updatedPolicy.startDate,
        end_date: updatedPolicy.endDate,
        status: updatedPolicy.status,
      })
      .eq('id', updatedPolicy.id);

    if (!error) {
      setPolicies(prev => prev.map(p => p.id === updatedPolicy.id ? updatedPolicy : p));
    }
  }, []);

  const deletePolicy = useCallback(async (policyId: string) => {
    const { error } = await supabase
      .from('policies')
      .delete()
      .eq('id', policyId);

    if (!error) {
      setPolicies(prev => prev.filter(p => p.id !== policyId));
    }
  }, []);

  const addTask = useCallback(async (taskData: Omit<Task, 'id' | 'status'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Usuário não autenticado');
        return;
      }

      const { data, error } = await supabase
        .from('tasks')
        .insert({
          title: taskData.title,
          description: taskData.description,
          status: TaskStatus.ToDo,
          client_id: taskData.clientId || null,
          opportunity_id: taskData.opportunityId || null,
          due_date: taskData.dueDate || null,
          recurrence: taskData.recurrence,
          user_id: user.id,
        })
        .select()
        .single();

      if (data && !error) {
        const newTask: Task = {
          id: data.id,
          title: data.title,
          description: data.description || '',
          status: data.status as TaskStatus,
          clientId: data.client_id || undefined,
          opportunityId: data.opportunity_id || undefined,
          dueDate: data.due_date || undefined,
          recurrence: data.recurrence as TaskRecurrence,
          userId: data.user_id || undefined,
        };
        setTasks(prev => [...prev, newTask]);
        toast.success('Tarefa adicionada com sucesso!');
      } else if (error) {
        console.error('Error adding task:', error);
        toast.error('Erro ao adicionar tarefa: ' + error.message);
      }
    } catch (error) {
      console.error('Error adding task:', error);
      toast.error('Erro ao adicionar tarefa.');
    }
  }, []);

  const updateTaskStatus = useCallback(async (taskId: string, newStatus: TaskStatus) => {
    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', taskId);

    if (!error) {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    }
  }, []);

  const updateTask = useCallback(async (updatedTask: Task) => {
    const { error } = await supabase
      .from('tasks')
      .update({
        title: updatedTask.title,
        description: updatedTask.description,
        status: updatedTask.status,
        client_id: updatedTask.clientId || null,
        opportunity_id: updatedTask.opportunityId || null,
        due_date: updatedTask.dueDate || null,
        recurrence: updatedTask.recurrence,
      })
      .eq('id', updatedTask.id);

    if (!error) {
      setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    }
  }, []);

  const updateRenewal = useCallback(async (updatedRenewal: Renewal) => {
    const { error } = await supabase
      .from('renewals')
      .update({
        status: updatedRenewal.status,
        salesperson: updatedRenewal.salesperson,
        next_contact_date: updatedRenewal.nextContactDate || null,
        notes: updatedRenewal.notes || null,
      })
      .eq('policy_id', updatedRenewal.policyId);

    if (!error) {
      setRenewals(prev => prev.map(r => r.policyId === updatedRenewal.policyId ? updatedRenewal : r));
    }
  }, []);

  const addUser = useCallback((userData: Omit<User, 'id'>) => {
    const newUser = { ...userData, id: Date.now().toString() };
    setUsers(prev => [...prev, newUser]);
  }, []);

  const updateUser = useCallback(async (updatedUser: User) => {
    // Update local state
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));

    // Update in Supabase
    await supabase
      .from('profiles')
      .update({
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        avatar_url: updatedUser.avatarUrl || null,
      })
      .eq('id', updatedUser.id);
  }, []);

  const deleteUser = useCallback((userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
  }, []);

  const refreshUsers = useCallback(async () => {
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesData) {
      const mappedUsers: User[] = profilesData.map(profile => ({
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: (profile.role === 'Gestor' || profile.role === 'Vendedor') ? profile.role : 'Vendedor',
        permissions: [],
        avatarUrl: profile.avatar_url || '',
      }));
      setUsers(mappedUsers);
    }
  }, []);

  const addOrigin = useCallback(async (origin: string) => {
    const trimmedOrigin = origin.trim();
    if (!trimmedOrigin) return;

    // Check if already exists in current list
    if (origins.some(o => o.toLowerCase() === trimmedOrigin.toLowerCase())) {
      toast.error('Esta origem já existe');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }

    // Check if already exists in database (case insensitive)
    const { data: existingOrigins } = await supabase
      .from('origins')
      .select('name')
      .ilike('name', trimmedOrigin);

    if (existingOrigins && existingOrigins.length > 0) {
      toast.error('Esta origem já existe no sistema');
      return;
    }

    const { error } = await supabase
      .from('origins')
      .insert({ name: trimmedOrigin, user_id: user.id });

    if (error) {
      console.error('Error adding origin:', error);
      toast.error('Erro ao adicionar origem: ' + error.message);
    } else {
      setOrigins(prev => [...prev, trimmedOrigin]);
      toast.success('Origem adicionada com sucesso!');
    }
  }, [origins]);

  const deleteOrigin = useCallback(async (originToDelete: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }

    const { error } = await supabase
      .from('origins')
      .delete()
      .eq('name', originToDelete);

    if (error) {
      console.error('Error deleting origin:', error);
      toast.error('Erro ao remover origem: ' + error.message);
    } else {
      setOrigins(prev => prev.filter(o => o !== originToDelete));
      toast.success('Origem removida com sucesso!');
    }
  }, []);

  const addPolicyType = useCallback(async (policyType: string) => {
    const trimmedType = policyType.trim();
    if (!trimmedType) return;

    // Check if already exists in current list
    if (policyTypes.some(t => t.toLowerCase() === trimmedType.toLowerCase())) {
      toast.error('Este tipo de apólice já existe');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }

    // Check if already exists in database (case insensitive)
    const { data: existingTypes } = await supabase
      .from('policy_types')
      .select('name')
      .ilike('name', trimmedType);

    if (existingTypes && existingTypes.length > 0) {
      toast.error('Este tipo de apólice já existe no sistema');
      return;
    }

    const { error } = await supabase
      .from('policy_types')
      .insert({ name: trimmedType, user_id: user.id });

    if (error) {
      console.error('Error adding policy type:', error);
      toast.error('Erro ao adicionar tipo de apólice: ' + error.message);
    } else {
      setPolicyTypes(prev => [...prev, trimmedType]);
      toast.success('Tipo de apólice adicionado com sucesso!');
    }
  }, [policyTypes]);

  const deletePolicyType = useCallback(async (typeToDelete: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }

    const { error } = await supabase
      .from('policy_types')
      .delete()
      .eq('name', typeToDelete);

    if (error) {
      console.error('Error deleting policy type:', error);
      toast.error('Erro ao remover tipo de apólice: ' + error.message);
    } else {
      setPolicyTypes(prev => prev.filter(t => t !== typeToDelete));
      toast.success('Tipo de apólice removido com sucesso!');
    }
  }, []);

  const updateSystemSettings = useCallback((settings: Partial<SystemSettings>) => {
    setSystemSettings(prev => ({ ...prev, ...settings }));
  }, []);

  const addInsuranceCompanyContact = useCallback(async (companyData: Omit<InsuranceCompanyContact, 'id'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: companyInserted, error: companyError } = await supabase
      .from('insurance_companies')
      .insert({
        name: companyData.name,
        contact_person: companyData.contactPerson,
        phone: companyData.phone,
        email: companyData.email,
        portal_url: companyData.portalUrl || null,
        user_id: user.id,
      })
      .select()
      .single();

    if (companyInserted && !companyError) {
      // Insert credentials using secure edge function with encryption
      if (companyData.credentials.length > 0) {
        const credentialPromises = companyData.credentials.map(async (cred) => {
          if (cred.systemName && cred.login) {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return null;

            const { data, error } = await supabase.functions.invoke('manage-credentials', {
              body: {
                action: 'create',
                insurance_company_id: companyInserted.id,
                system_name: cred.systemName,
                login: cred.login,
                password: cred.password || '',
              },
              headers: {
                Authorization: `Bearer ${session.access_token}`,
              },
            });

            if (error) {
              console.error('Error creating credential:', error);
            }
            return data;
          }
          return null;
        });

        await Promise.all(credentialPromises);
      }

      const newCompany: InsuranceCompanyContact = {
        id: companyInserted.id,
        name: companyInserted.name,
        contactPerson: companyInserted.contact_person,
        phone: companyInserted.phone,
        email: companyInserted.email,
        portalUrl: companyInserted.portal_url || undefined,
        credentials: companyData.credentials,
      };
      setInsuranceCompanyContacts(prev => [...prev, newCompany]);
    }
  }, []);

  const updateInsuranceCompanyContact = useCallback(async (updatedCompany: InsuranceCompanyContact) => {
    const { error: companyError } = await supabase
      .from('insurance_companies')
      .update({
        name: updatedCompany.name,
        contact_person: updatedCompany.contactPerson,
        phone: updatedCompany.phone,
        email: updatedCompany.email,
        portal_url: updatedCompany.portalUrl || null,
      })
      .eq('id', updatedCompany.id);

    if (!companyError) {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Delete existing credentials (admin-only operation, will be audited)
      await supabase
        .from('credentials')
        .delete()
        .eq('insurance_company_id', updatedCompany.id);

      // Insert new credentials using secure edge function with encryption
      if (updatedCompany.credentials.length > 0) {
        const credentialPromises = updatedCompany.credentials.map(async (cred) => {
          if (cred.systemName && cred.login) {
            const { data, error } = await supabase.functions.invoke('manage-credentials', {
              body: {
                action: 'create',
                insurance_company_id: updatedCompany.id,
                system_name: cred.systemName,
                login: cred.login,
                password: cred.password || '',
              },
              headers: {
                Authorization: `Bearer ${session.access_token}`,
              },
            });

            if (error) {
              console.error('Error creating credential:', error);
            }
            return data;
          }
          return null;
        });

        await Promise.all(credentialPromises);
      }

      setInsuranceCompanyContacts(prev => prev.map(c => c.id === updatedCompany.id ? updatedCompany : c));
    }
  }, []);

  const deleteInsuranceCompanyContact = useCallback(async (companyId: string) => {
    const { error } = await supabase
      .from('insurance_companies')
      .delete()
      .eq('id', companyId);

    if (!error) {
      setInsuranceCompanyContacts(prev => prev.filter(c => c.id !== companyId));
    }
  }, []);

  const addOpportunity = useCallback(async (opportunityData: Omit<Opportunity, 'id' | 'createdAt' | 'stage' | 'activities'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get the first stage of the funnel from configuration
    const firstStage = funnelStages
      .filter(stage => stage.funnelKey === opportunityData.funnelType)
      .sort((a, b) => a.orderIndex - b.orderIndex)[0]?.stageName || '';

    const { data, error } = await supabase
      .from('opportunities')
      .insert({
        funnel_type: opportunityData.funnelType,
        stage: firstStage,
        title: opportunityData.title,
        client_id: opportunityData.clientId,
        value: opportunityData.value,
        commission: opportunityData.commission,
        expected_close_date: opportunityData.expectedCloseDate,
        deal_type: opportunityData.dealType,
        salesperson: opportunityData.salesperson,
        origin: opportunityData.origin,
        technical_responsible: opportunityData.technicalResponsible,
        renewal_responsible: opportunityData.renewalResponsible,
        insurance_type: opportunityData.insuranceType,
        insurance_company: opportunityData.insuranceCompany,
        notes: opportunityData.notes || null,
        user_id: user.id,
      })
      .select()
      .single();

    if (data && !error) {
      const newOpportunity: Opportunity = {
        id: data.id,
        funnelType: data.funnel_type,
        stage: data.stage,
        title: data.title,
        clientId: data.client_id,
        value: typeof data.value === 'string' ? parseFloat(data.value) : data.value,
        commission: typeof data.commission === 'string' ? parseFloat(data.commission) : data.commission,
        expectedCloseDate: data.expected_close_date,
        dealType: data.deal_type as DealType,
        salesperson: data.salesperson,
        origin: data.origin,
        technicalResponsible: data.technical_responsible,
        renewalResponsible: data.renewal_responsible,
        insuranceType: data.insurance_type,
        insuranceCompany: data.insurance_company,
        notes: data.notes || undefined,
        createdAt: data.created_at.split('T')[0],
        activities: [],
      };
      setOpportunities(prev => [...prev, newOpportunity]);
    }
  }, []);

  const updateOpportunity = useCallback(async (updatedOpportunity: Opportunity) => {
    const { error } = await supabase
      .from('opportunities')
      .update({
        funnel_type: updatedOpportunity.funnelType,
        stage: updatedOpportunity.stage,
        title: updatedOpportunity.title,
        client_id: updatedOpportunity.clientId,
        value: updatedOpportunity.value,
        commission: updatedOpportunity.commission,
        expected_close_date: updatedOpportunity.expectedCloseDate,
        deal_type: updatedOpportunity.dealType,
        salesperson: updatedOpportunity.salesperson,
        origin: updatedOpportunity.origin,
        technical_responsible: updatedOpportunity.technicalResponsible,
        renewal_responsible: updatedOpportunity.renewalResponsible,
        insurance_type: updatedOpportunity.insuranceType,
        insurance_company: updatedOpportunity.insuranceCompany,
        notes: updatedOpportunity.notes || null,
      })
      .eq('id', updatedOpportunity.id);

    if (!error) {
      setOpportunities(prev => prev.map(o => o.id === updatedOpportunity.id ? updatedOpportunity : o));
    }
  }, []);

  const updateOpportunityStage = useCallback(async (opportunityId: string, newStage: string) => {
    const { error } = await supabase
      .from('opportunities')
      .update({ stage: newStage })
      .eq('id', opportunityId);

    if (!error) {
      setOpportunities(prev => prev.map(o => o.id === opportunityId ? { ...o, stage: newStage } : o));
    }
  }, []);

  const addFunnelActivity = useCallback(async (opportunityId: string, activity: Omit<FunnelActivity, 'id'>) => {
    const { data, error } = await supabase
      .from('funnel_activities')
      .insert({
        opportunity_id: opportunityId,
        text: activity.text,
        stage: activity.stage,
        completed: activity.completed,
        assigned_to: activity.assignedTo,
        due_date: activity.dueDate || null,
        due_time: activity.dueTime || null,
      })
      .select()
      .single();

    if (data && !error) {
      const newActivity: FunnelActivity = {
        id: data.id,
        text: data.text,
        stage: data.stage,
        completed: data.completed,
        assignedTo: data.assigned_to,
        dueDate: data.due_date || undefined,
        dueTime: data.due_time || undefined,
      };

      setOpportunities(prev => prev.map(o =>
        o.id === opportunityId
          ? { ...o, activities: [...o.activities, newActivity] }
          : o
      ));
      toast.success('Atividade adicionada com sucesso!');
    } else if (error) {
      console.error('Erro ao adicionar atividade:', error);
      toast.error('Erro ao adicionar atividade: ' + error.message);
    }
  }, []);

  const updateFunnelActivity = useCallback(async (opportunityId: string, updatedActivity: FunnelActivity) => {
    const { error } = await supabase
      .from('funnel_activities')
      .update({
        text: updatedActivity.text,
        stage: updatedActivity.stage,
        completed: updatedActivity.completed,
        assigned_to: updatedActivity.assignedTo,
        due_date: updatedActivity.dueDate || null,
        due_time: updatedActivity.dueTime || null,
      })
      .eq('id', updatedActivity.id);

    if (!error) {
      setOpportunities(prev => prev.map(o => {
        if (o.id === opportunityId) {
          return {
            ...o,
            activities: o.activities.map(act => act.id === updatedActivity.id ? updatedActivity : act)
          };
        }
        return o;
      }));
    }
  }, []);

  const addFunnelActivityTemplate = useCallback((templateData: Omit<FunnelActivityTemplate, 'id' | 'orderIndex'>) => {
    const existingTemplates = funnelActivityTemplates.filter(
      t => t.funnelType === templateData.funnelType && t.stage === templateData.stage
    );
    const maxOrder = existingTemplates.length > 0
      ? Math.max(...existingTemplates.map(t => t.orderIndex))
      : -1;

    const newTemplate: FunnelActivityTemplate = {
      ...templateData,
      id: `tpl-${Date.now()}`,
      orderIndex: maxOrder + 1,
    };
    setFunnelActivityTemplates(prev => [...prev, newTemplate]);
  }, [funnelActivityTemplates]);

  const updateFunnelActivityTemplate = useCallback((updatedTemplate: FunnelActivityTemplate) => {
    setFunnelActivityTemplates(prev =>
      prev.map(t => t.id === updatedTemplate.id ? updatedTemplate : t)
    );
  }, []);

  const deleteFunnelActivityTemplate = useCallback((templateId: string) => {
    setFunnelActivityTemplates(prev => {
      const templateToDelete = prev.find(t => t.id === templateId);
      if (!templateToDelete) return prev;

      const filtered = prev.filter(t => t.id !== templateId);

      // Reorder remaining templates in the same funnel/stage
      return filtered.map(t => {
        if (t.funnelType === templateToDelete.funnelType &&
          t.stage === templateToDelete.stage &&
          t.orderIndex > templateToDelete.orderIndex) {
          return { ...t, orderIndex: t.orderIndex - 1 };
        }
        return t;
      });
    });
  }, []);

  const moveFunnelActivityTemplate = useCallback((templateId: string, direction: 'up' | 'down') => {
    setFunnelActivityTemplates(prev => {
      const template = prev.find(t => t.id === templateId);
      if (!template) return prev;

      const sameGroup = prev.filter(
        t => t.funnelType === template.funnelType && t.stage === template.stage
      ).sort((a, b) => a.orderIndex - b.orderIndex);

      const currentIndex = sameGroup.findIndex(t => t.id === templateId);
      if (
        (direction === 'up' && currentIndex === 0) ||
        (direction === 'down' && currentIndex === sameGroup.length - 1)
      ) {
        return prev;
      }

      const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      const swapWith = sameGroup[swapIndex];

      return prev.map(t => {
        if (t.id === templateId) {
          return { ...t, orderIndex: swapWith.orderIndex };
        }
        if (t.id === swapWith.id) {
          return { ...t, orderIndex: template.orderIndex };
        }
        return t;
      });
    });
  }, []);

  // Funnel Configuration Management
  const addFunnelConfiguration = useCallback((funnelName: string) => {
    const maxOrder = funnelConfigurations.length > 0
      ? Math.max(...funnelConfigurations.map(f => f.orderIndex))
      : -1;

    const funnelKey = funnelName.toLowerCase().replace(/\s+/g, '_');
    const newFunnel: FunnelConfiguration = {
      id: `fc-${Date.now()}`,
      funnelName,
      funnelKey,
      isActive: true,
      orderIndex: maxOrder + 1,
    };
    setFunnelConfigurations(prev => [...prev, newFunnel]);
  }, [funnelConfigurations]);

  const updateFunnelConfiguration = useCallback((updatedFunnel: FunnelConfiguration) => {
    setFunnelConfigurations(prev =>
      prev.map(f => f.id === updatedFunnel.id ? updatedFunnel : f)
    );
  }, []);

  const deleteFunnelConfiguration = useCallback((funnelId: string) => {
    const funnel = funnelConfigurations.find(f => f.id === funnelId);
    if (!funnel) return;

    // Delete related stages and templates
    setFunnelStages(prev => prev.filter(s => s.funnelKey !== funnel.funnelKey));
    setFunnelActivityTemplates(prev => prev.filter(t => t.funnelType !== funnel.funnelKey));

    setFunnelConfigurations(prev => {
      const filtered = prev.filter(f => f.id !== funnelId);
      return filtered.map((f, idx) => ({ ...f, orderIndex: idx }));
    });
  }, [funnelConfigurations]);

  const moveFunnelConfiguration = useCallback((funnelId: string, direction: 'up' | 'down') => {
    setFunnelConfigurations(prev => {
      const sorted = [...prev].sort((a, b) => a.orderIndex - b.orderIndex);
      const currentIndex = sorted.findIndex(f => f.id === funnelId);

      if (
        (direction === 'up' && currentIndex === 0) ||
        (direction === 'down' && currentIndex === sorted.length - 1)
      ) {
        return prev;
      }

      const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      const current = sorted[currentIndex];
      const swapWith = sorted[swapIndex];

      return prev.map(f => {
        if (f.id === current.id) return { ...f, orderIndex: swapWith.orderIndex };
        if (f.id === swapWith.id) return { ...f, orderIndex: current.orderIndex };
        return f;
      });
    });
  }, []);

  // Funnel Stage Management
  const addFunnelStage = useCallback((funnelKey: string, stageName: string) => {
    const existingStages = funnelStages.filter(s => s.funnelKey === funnelKey);
    const maxOrder = existingStages.length > 0
      ? Math.max(...existingStages.map(s => s.orderIndex))
      : -1;

    const stageKey = stageName.toLowerCase().replace(/\s+/g, '_');
    const newStage: FunnelStage = {
      id: `fs-${Date.now()}`,
      funnelKey,
      stageName,
      stageKey,
      orderIndex: maxOrder + 1,
    };
    setFunnelStages(prev => [...prev, newStage]);
  }, [funnelStages]);

  const updateFunnelStage = useCallback((updatedStage: FunnelStage) => {
    setFunnelStages(prev =>
      prev.map(s => s.id === updatedStage.id ? updatedStage : s)
    );
  }, []);

  const deleteFunnelStage = useCallback((stageId: string) => {
    const stage = funnelStages.find(s => s.id === stageId);
    if (!stage) return;

    // Delete related templates
    setFunnelActivityTemplates(prev =>
      prev.filter(t => !(t.funnelType === stage.funnelKey && t.stage === stage.stageKey))
    );

    setFunnelStages(prev => {
      const filtered = prev.filter(s => s.id !== stageId);
      // Reorder remaining stages in the same funnel
      return filtered.map(s => {
        if (s.funnelKey === stage.funnelKey && s.orderIndex > stage.orderIndex) {
          return { ...s, orderIndex: s.orderIndex - 1 };
        }
        return s;
      });
    });
  }, [funnelStages]);

  const moveFunnelStage = useCallback((stageId: string, direction: 'up' | 'down') => {
    setFunnelStages(prev => {
      const stage = prev.find(s => s.id === stageId);
      if (!stage) return prev;

      const sameGroup = prev.filter(s => s.funnelKey === stage.funnelKey)
        .sort((a, b) => a.orderIndex - b.orderIndex);

      const currentIndex = sameGroup.findIndex(s => s.id === stageId);
      if (
        (direction === 'up' && currentIndex === 0) ||
        (direction === 'down' && currentIndex === sameGroup.length - 1)
      ) {
        return prev;
      }

      const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      const swapWith = sameGroup[swapIndex];

      return prev.map(s => {
        if (s.id === stageId) return { ...s, orderIndex: swapWith.orderIndex };
        if (s.id === swapWith.id) return { ...s, orderIndex: stage.orderIndex };
        return s;
      });
    });
  }, []);

  return {
    clients, policies, tasks, renewals, users, origins, policyTypes, insuranceCompanyContacts,
    opportunities, funnelActivityTemplates, funnelConfigurations, funnelStages,
    systemSettings, addClient, updateClient, deleteClient, addPolicy, updatePolicy, deletePolicy,
    addTask, updateTaskStatus, updateTask, updateRenewal,
    addUser, updateUser, deleteUser, refreshUsers, addOrigin, deleteOrigin,
    updateSystemSettings, addPolicyType, deletePolicyType,
    addInsuranceCompanyContact, updateInsuranceCompanyContact, deleteInsuranceCompanyContact,
    addOpportunity, updateOpportunity, updateOpportunityStage, addFunnelActivity, updateFunnelActivity,
    addFunnelActivityTemplate, updateFunnelActivityTemplate, deleteFunnelActivityTemplate, moveFunnelActivityTemplate,
    addFunnelConfiguration, updateFunnelConfiguration, deleteFunnelConfiguration, moveFunnelConfiguration,
    addFunnelStage, updateFunnelStage, deleteFunnelStage, moveFunnelStage,
  };
};

export default useLDRState;