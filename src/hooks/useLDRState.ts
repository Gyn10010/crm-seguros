import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Client, Policy, PolicyType, PolicyStatus, Task, TaskStatus, TaskRecurrence,
  Renewal, RenewalStatus, User, Page, SystemSettings, InsuranceCompanyContact,
  FunnelConfiguration, FunnelStage, FunnelActivityTemplate, Opportunity, FunnelActivity, DealType
} from '../types/index';

// Import domain-specific hooks
import { useClients } from './useClients';
import { usePolicies } from './usePolicies';
import { useFunnels } from './useFunnels';
import { useOpportunities } from './useOpportunities';
import { useSystem } from './useSystem';

// --- INTERFACE ---
export interface LDRState {
  // Clients
  clients: Client[];
  // Policies
  policies: Policy[];
  // Tasks
  tasks: Task[];
  // Renewals
  renewals: Renewal[];
  // Users
  users: User[];
  // Opportunities
  opportunities: Opportunity[];
  // Origins
  origins: string[];
  // Policy Types
  policyTypes: string[];
  // Insurance Companies
  insuranceCompanyContacts: InsuranceCompanyContact[];
  // Funnel Configs
  funnelConfigurations: FunnelConfiguration[];
  funnelStages: FunnelStage[];
  funnelActivityTemplates: FunnelActivityTemplate[];
  // System Settings
  systemSettings: SystemSettings;

  // Actions - Clients
  addClient: (client: Omit<Client, 'id' | 'createdAt'>) => void;
  updateClient: (client: Client) => void;
  deleteClient: (clientId: string) => void;

  // Actions - Policies
  addPolicy: (policy: Omit<Policy, 'id'>) => void;
  updatePolicy: (policy: Policy) => void;
  deletePolicy: (policyId: string) => void;

  // Actions - Tasks
  addTask: (task: Omit<Task, 'id' | 'status'>) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  updateTask: (task: Task) => void;

  // Actions - Renewals
  updateRenewal: (renewal: Renewal) => void;

  // Actions - Users
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (user: User) => void;
  deleteUser: (userId: string) => void;
  refreshUsers: () => void;

  // Actions - Origins
  addOrigin: (origin: string) => void;
  deleteOrigin: (origin: string) => void;

  // Actions - System Settings
  updateSystemSettings: (settings: Partial<SystemSettings>) => void;

  // Actions - Policy Types
  addPolicyType: (type: string) => void;
  deletePolicyType: (type: string) => void;

  // Actions - Insurance Companies
  addInsuranceCompanyContact: (contact: Omit<InsuranceCompanyContact, 'id'>) => void;
  updateInsuranceCompanyContact: (contact: InsuranceCompanyContact) => void;
  deleteInsuranceCompanyContact: (contactId: string) => void;

  // Actions - Opportunities
  addOpportunity: (opportunity: Omit<Opportunity, 'id' | 'createdAt' | 'stage' | 'activities'>) => void;
  updateOpportunity: (opportunity: Opportunity) => void;
  deleteOpportunity: (opportunityId: string) => void;
  updateOpportunityStage: (opportunityId: string, newStage: string) => void;

  // Actions - Funnel Activities
  addFunnelActivity: (opportunityId: string, activity: Omit<FunnelActivity, 'id'>) => void;
  updateFunnelActivity: (opportunityId: string, activity: FunnelActivity) => void;

  // Actions - Funnel Templates
  addFunnelActivityTemplate: (template: Omit<FunnelActivityTemplate, 'id' | 'orderIndex'>) => void;
  updateFunnelActivityTemplate: (template: FunnelActivityTemplate) => void;
  deleteFunnelActivityTemplate: (templateId: string) => void;
  moveFunnelActivityTemplate: (templateId: string, direction: 'up' | 'down') => void;

  // Actions - Funnel Configuration
  addFunnelConfiguration: (funnelName: string) => void;
  updateFunnelConfiguration: (funnel: FunnelConfiguration) => void;
  deleteFunnelConfiguration: (funnelId: string) => void;
  moveFunnelConfiguration: (funnelId: string, direction: 'up' | 'down') => void;

  // Actions - Funnel Stages
  addFunnelStage: (funnelKey: string, stageName: string) => void;
  updateFunnelStage: (stage: FunnelStage) => void;
  deleteFunnelStage: (stageId: string) => void;
  moveFunnelStage: (stageId: string, direction: 'up' | 'down') => void;
}

const useLDRState = (): LDRState => {
  // Compose hooks
  const {
    clients, setClients, addClient, updateClient, deleteClient
  } = useClients();

  const {
    policies, setPolicies, policyTypes, setPolicyTypes, insuranceCompanyContacts, setInsuranceCompanyContacts,
    addPolicy, updatePolicy, deletePolicy, addPolicyType, deletePolicyType,
    addInsuranceCompanyContact, updateInsuranceCompanyContact, deleteInsuranceCompanyContact
  } = usePolicies();

  const {
    funnelConfigurations, setFunnelConfigurations, funnelStages, setFunnelStages,
    funnelActivityTemplates, setFunnelActivityTemplates,
    addFunnelConfiguration, updateFunnelConfiguration, deleteFunnelConfiguration, moveFunnelConfiguration,
    addFunnelStage, updateFunnelStage, deleteFunnelStage, moveFunnelStage,
    addFunnelActivityTemplate, updateFunnelActivityTemplate, deleteFunnelActivityTemplate, moveFunnelActivityTemplate
  } = useFunnels();

  const {
    opportunities, setOpportunities, origins, setOrigins,
    addOpportunity, updateOpportunity, deleteOpportunity, updateOpportunityStage,
    addFunnelActivity, updateFunnelActivity, addOrigin, deleteOrigin
  } = useOpportunities();

  const {
    users, setUsers, systemSettings, setSystemSettings, tasks, setTasks, renewals, setRenewals,
    addUser, updateUser, deleteUser, refreshUsers, updateSystemSettings,
    addTask, updateTaskStatus, updateTask, updateRenewal
  } = useSystem();

  // Load Initial Data
  const loadAllData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Clients
      const { data: clientsData } = await supabase.from('clients').select('*');
      if (clientsData) {
        setClients(clientsData.map(c => ({
          id: c.id,
          name: c.name,
          email: c.email,
          phone: c.phone,
          address: c.address,
          personType: c.person_type as 'Física' | 'Jurídica',
          city: c.city,
          state: c.state,
          document: c.document,
          birthDate: c.birth_date,
          createdAt: c.created_at.split('T')[0],
        })));
      }

      // 2. Policies
      const { data: policiesData } = await supabase.from('policies').select('*');
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
        })));
      }

      // 3. Tasks
      const { data: tasksData } = await supabase.from('tasks').select('*');
      if (tasksData) {
        setTasks(tasksData.map(t => ({
          id: t.id,
          title: t.title,
          description: t.description || '',
          status: t.status === 'completed' ? TaskStatus.Done : TaskStatus.ToDo,
          clientId: t.client_id,
          dueDate: t.due_date,
          recurrence: t.recurrence as TaskRecurrence,
        })));
      }

      // 4. Renewals
      const { data: renewalsData } = await supabase.from('renewals').select('*');
      if (renewalsData) {
        setRenewals(renewalsData.map(r => ({
          policyId: r.policy_id,
          clientId: r.client_id,
          status: r.status as RenewalStatus,
          salesperson: 'Usuário Demo', // Placeholder
          nextContactDate: r.next_contact_date,
          notes: r.notes || '',
        })));
      }

      // 5. Opportunities
      const { data: opportunitiesData } = await supabase.from('opportunities').select(`
        *,
        funnel_activities (*)
      `);

      if (opportunitiesData) {
        setOpportunities(opportunitiesData.map(o => ({
          id: o.id,
          funnelType: o.funnel_type,
          stage: o.stage,
          title: o.title,
          clientId: o.client_id,
          value: typeof o.value === 'string' ? parseFloat(o.value) : o.value,
          commission: typeof o.commission === 'string' ? parseFloat(o.commission) : o.commission,
          expectedCloseDate: o.expected_close_date,
          dealType: o.deal_type as DealType,
          salesperson: o.salesperson,
          origin: o.origin,
          technicalResponsible: o.technical_responsible,
          renewalResponsible: o.renewal_responsible,
          insuranceType: o.insurance_type,
          insuranceCompany: o.insurance_company,
          notes: o.notes || undefined,
          createdAt: o.created_at.split('T')[0],
          activities: o.funnel_activities.map((a: any) => ({
            id: a.id,
            text: a.text,
            stage: a.stage,
            completed: a.completed,
            assignedTo: a.assigned_to,
            dueDate: a.due_date || undefined,
            dueTime: a.due_time || undefined,
          })),
        })));
      }

      // 6. Funnel Configs
      const { data: funnelConfigsData } = await supabase.from('funnel_configurations').select('*').order('order_index');
      if (funnelConfigsData) {
        setFunnelConfigurations(funnelConfigsData.map(f => ({
          id: f.id,
          funnelName: f.funnel_name,
          funnelKey: f.funnel_key,
          isActive: f.is_active,
          orderIndex: f.order_index,
        })));
      }

      // 7. Funnel Stages
      const { data: funnelStagesData } = await supabase.from('funnel_stages').select('*').order('order_index');
      if (funnelStagesData) {
        setFunnelStages(funnelStagesData.map(s => ({
          id: s.id,
          funnelKey: s.funnel_key,
          stageName: s.stage_name,
          stageKey: s.stage_key,
          orderIndex: s.order_index,
        })));
      }

      // 8. Origins
      const { data: originsData } = await supabase.from('origins').select('name');
      if (originsData) {
        setOrigins(originsData.map(o => o.name));
      }

      // 9. Policy Types
      const { data: policyTypesData } = await supabase.from('policy_types').select('name');
      if (policyTypesData) {
        setPolicyTypes(policyTypesData.map(pt => pt.name));
      }

      // 10. Insurance Companies
      const { data: insuranceCompaniesData } = await supabase.from('insurance_companies').select('*');
      if (insuranceCompaniesData) {
        setInsuranceCompanyContacts(insuranceCompaniesData.map(ic => ({
          id: ic.id,
          name: ic.name,
          contactPerson: ic.contact_person,
          phone: ic.phone,
          email: ic.email,
          credentials: [],
          portalUrl: ic.portal_url
        })));
      }

      // 11. Users (Profiles)
      const { data: profilesData } = await supabase.from('profiles').select('*');
      if (profilesData) {
        const usersFromSupabase = profilesData.map(p => ({
          id: p.id,
          name: p.name || 'Usuário',
          email: 'email@exemplo.com',
          role: (p.role === 'Gestor' ? 'Gestor' : 'Vendedor') as 'Gestor' | 'Vendedor',
          permissions: [] as Page[],
          avatarUrl: p.avatar_url || '',
        }));

        // Salvar no localStorage para UserService
        import('@/shared/services').then(({ STORAGE_KEYS, LocalStorageService }) => {
          LocalStorageService.set(STORAGE_KEYS.TEAM_USERS, usersFromSupabase);
        });

        setUsers(usersFromSupabase);
      }

    } catch (error) {
      console.error('Error loading data:', error);
    }
  }, [
    setClients, setPolicies, setTasks, setRenewals, setOpportunities,
    setFunnelConfigurations, setFunnelStages, setOrigins, setPolicyTypes,
    setInsuranceCompanyContacts, setUsers
  ]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  return {
    clients,
    policies,
    tasks,
    renewals,
    users,
    opportunities,
    origins,
    policyTypes,
    insuranceCompanyContacts,
    funnelConfigurations,
    funnelStages,
    funnelActivityTemplates,
    systemSettings,

    addClient,
    updateClient,
    deleteClient,

    addPolicy,
    updatePolicy,
    deletePolicy,

    addTask,
    updateTaskStatus,
    updateTask,

    updateRenewal,

    addUser,
    updateUser,
    deleteUser,
    refreshUsers,

    addOrigin,
    deleteOrigin,

    updateSystemSettings,

    addPolicyType,
    deletePolicyType,

    addInsuranceCompanyContact,
    updateInsuranceCompanyContact,
    deleteInsuranceCompanyContact,

    addOpportunity,
    updateOpportunity,
    deleteOpportunity,
    updateOpportunityStage,

    addFunnelActivity,
    updateFunnelActivity,

    addFunnelActivityTemplate,
    updateFunnelActivityTemplate,
    deleteFunnelActivityTemplate,
    moveFunnelActivityTemplate,

    addFunnelConfiguration,
    updateFunnelConfiguration,
    deleteFunnelConfiguration,
    moveFunnelConfiguration,

    addFunnelStage,
    updateFunnelStage,
    deleteFunnelStage,
    moveFunnelStage,
  };
};

export default useLDRState;