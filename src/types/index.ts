export enum Page {
    Dashboard = 'Dashboard',
    Clients = 'Clients',
    Policies = 'Policies',
    InsuranceCompanies = 'InsuranceCompanies',
    Tasks = 'Tasks',
    Renewals = 'Renewals',
    Settings = 'Settings',
    SalesFunnel = 'SalesFunnel',
}

export interface Client {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    createdAt: string;
    personType?: 'Física' | 'Jurídica';
    city?: string;
    state?: string;
    zipCode?: string;
    document?: string; // CPF/CNPJ
    salesperson?: string;
    birthDate?: string;
    businessSector?: string;
    monthlyIncome?: number;
    licenseExpiry?: string;
    isActive?: boolean;
    maritalStatus?: string;
    relatedClients?: Array<{ clientId: string; relationship: string }>;
    profession?: string;
    gender?: 'Masculino' | 'Feminino' | 'Outro' | 'Prefiro não informar';
}

export type PolicyType = string;

export enum PolicyStatus {
    Active = 'Ativa',
    Pending = 'Pendente',
    Expired = 'Expirada',
    Canceled = 'Cancelada',
}

export interface Policy {
    id: string;
    clientId: string;
    policyNumber: string;
    insuranceCompany: string;
    type: PolicyType;
    premium: number; // PRÊMIO TOTAL
    commission: number; // COMISSÃO (percentage)
    startDate: string; // VIGÊNCIA INICIAL
    endDate: string; // VIGÊNCIA FINAL
    status: PolicyStatus; // STATUS APÓLICE
    documentType?: string; // TIPO DOCUMENTO (endosso, apólice)
    netPremium?: number; // PRÊMIO LÍQUIDO
    generatedCommission?: number; // COMISSÃO GERADA
    installments?: number; // QUANTIDADE PARCELAS
    paymentType?: string; // TIPO PAGAMENTO
    branch?: string; // RAMO
    product?: string; // PRODUTO
    item?: string; // ITEM
    proposal?: string; // PROPOSTA
    endorsementProposal?: string; // PROPOSTA ENDOSSO
    endorsement?: string; // ENDOSSO
    sellerTransfer?: number; // REPASSE VENDEDOR
}

export interface PolicyFieldConfig {
    id: string;
    userId: string;
    fieldName: string;
    isRequired: boolean;
}

export interface ClientFieldConfig {
    id: string;
    userId: string;
    fieldName: string;
    isRequired: boolean;
}

export enum TaskRecurrence {
    None = 'Nenhuma',
    Daily = 'Diária',
    Weekly = 'Semanal',
    Monthly = 'Mensal',
}

export enum TaskStatus {
    ToDo = 'A Fazer',
    InProgress = 'Em Andamento',
    Done = 'Concluído',
}

export interface Task {
    id: string;
    title: string;
    description: string;
    status: TaskStatus;
    clientId?: string;
    dueDate?: string;
    recurrence: TaskRecurrence;
    opportunityId?: string;
    userId?: string;
    isFunnelActivity?: boolean;
    originalActivityId?: string;
}

export enum RenewalStatus {
    Pending = 'Pendente',
    InProgress = 'Em Negociação',
    Done = 'Renovada',
    Lost = 'Perdida',
}

export interface Renewal {
    policyId: string;
    clientId: string;
    status: RenewalStatus;
    salesperson: string;
    nextContactDate?: string;
    notes: string;
}

export interface User {
    id: string;
    name: string;
    email: string;
    role: 'Gestor' | 'Vendedor';
    permissions: Page[];
    avatarUrl?: string;
}

export interface SystemSettings {
    companyName: string;
    themeColor: string;
    currency: string;
    renewalAlertDays: number;
}

export interface Credential {
    id: string;
    systemName: string;
    login: string;
    password?: string;
}

export interface InsuranceCompanyContact {
    id: string;
    name: string;
    contactPerson: string;
    phone: string;
    email: string;
    credentials: Credential[];
    portalUrl?: string;
}

// DEPRECATED: These enums are kept for reference but should not be used
// The system now uses dynamic funnels from funnel_configurations table
/*
export enum FunnelType {
    NewSales = 'Novos Negócios',
    PostSales = 'Pós-Venda',
    Endorsement = 'Endosso',
    Claim = 'Sinistro',
    InstallmentFollowUp = 'Acompanhamento de Parcela',
    Renewal = 'Renovação',
}

export enum DealType {
    New = 'Novo',
    Renewal = 'Renovação',
    CrossSell = 'Cross-Sell',
    UpSell = 'Up-Sell',
}

export enum NewSalesFunnelStage {
    Prospect = 'Prospecção',
    Qualification = 'Qualificação',
    Proposal = 'Proposta',
    Negotiation = 'Negociação',
    ClosedWon = 'Fechado Ganho',
    ClosedLost = 'Fechado Perdido',
}

export enum PostSalesFunnelStage {
    Issuance = 'Emissão',
    PolicySent = 'Apólice Enviada',
    FirstInstallmentFollowUp = 'Acompanhamento 1ª Parcela',
    Finished = 'Finalizado',
}

export enum EndorsementFunnelStage {
    Request = 'Solicitação',
    Processing = 'Em Processamento',
    Issued = 'Emitido',
    Finished = 'Finalizado',
}

export enum ClaimFunnelStage {
    Notice = 'Aviso de Sinistro',
    Documentation = 'Envio Documentação',
    Analysis = 'Análise',
    Payment = 'Pagamento',
    Finished = 'Finalizado',
}

export enum InstallmentFollowUpFunnelStage {
    Pending = 'Pendente',
    Contacted = 'Contatado',
    Paid = 'Pago',
    Overdue = 'Vencido',
}

export enum RenewalFunnelStage {
    Calculation = 'Cálculo',
    Presentation = 'Apresentação',
    Negotiation = 'Negociação',
    ClosedWon = 'Fechado Ganho',
    ClosedLost = 'Fechado Perdido',
}

export type AllFunnelStages =
    | NewSalesFunnelStage
    | PostSalesFunnelStage
    | EndorsementFunnelStage
    | ClaimFunnelStage
    | InstallmentFollowUpFunnelStage
    | RenewalFunnelStage;

export const funnelStageMap: Record<FunnelType, AllFunnelStages[]> = {
    [FunnelType.NewSales]: Object.values(NewSalesFunnelStage),
    [FunnelType.PostSales]: Object.values(PostSalesFunnelStage),
    [FunnelType.Endorsement]: Object.values(EndorsementFunnelStage),
    [FunnelType.Claim]: Object.values(ClaimFunnelStage),
    [FunnelType.InstallmentFollowUp]: Object.values(InstallmentFollowUpFunnelStage),
    [FunnelType.Renewal]: Object.values(RenewalFunnelStage),
};
*/


export enum DealType {
    New = 'Novo',
    Renewal = 'Renovação',
    CrossSell = 'Cross-Sell',
    UpSell = 'Up-Sell',
}

export interface FunnelActivity {
    id: string;
    text: string;
    stage: string; // Changed from AllFunnelStages to string for dynamic stages
    completed: boolean;
    assignedTo: string; // userId
    dueDate?: string;
    dueTime?: string;
    startedAt?: string; // Timestamp when activity timer started
}

export interface Opportunity {
    id: string;
    funnelType: string; // Changed from FunnelType to string for dynamic funnels
    stage: string; // Changed from AllFunnelStages to string for dynamic stages
    title: string;
    clientId: string;
    value: number; // premium
    commission: number; // percentage
    expectedCloseDate: string;
    dealType: DealType;
    salesperson: string;
    origin: string;
    technicalResponsible: string;
    renewalResponsible: string;
    insuranceType: PolicyType;
    insuranceCompany: string;
    activities: FunnelActivity[];
    notes?: string;
    createdAt: string;
}

export interface FunnelActivityTemplate {
    id: string;
    funnelType: string;
    stage: string;
    activityText: string;
    orderIndex: number;
}

export interface FunnelConfiguration {
    id: string;
    funnelName: string;
    funnelKey: string;
    isActive: boolean;
    orderIndex: number;
}

export interface FunnelStage {
    id: string;
    funnelKey: string;
    stageName: string;
    stageKey: string;
    orderIndex: number;
}

export interface ChatMessage {
    id: string;
    sender: 'user' | 'ai';
    text: string;
    timestamp: string;
}

export interface ActivityTemplate {
    id: string;
    name: string;
    responsibleType: 'salesperson' | 'technical' | 'renewal' | 'any';
    maxHours: number;
    isActive: boolean;
    orderIndex: number;
}