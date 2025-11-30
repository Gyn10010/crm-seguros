
import React from 'react';
import { PolicyStatus, PolicyType } from '../types/index';
import { LDRState } from '../hooks/useLDRState';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface DashboardProps {
    ldrState: LDRState;
}

const StatCard: React.FC<{ title: string; value: string | number; description: string }> = ({ title, value, description }) => (
    <div className="bg-ui-card p-6 rounded-lg border border-ui-border shadow-sm">
        <h3 className="text-sm font-medium text-text-secondary">{title}</h3>
        <p className="text-3xl font-bold text-text-primary mt-1">{value}</p>
        <p className="text-xs text-text-muted mt-2">{description}</p>
    </div>
);

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

const Dashboard: React.FC<DashboardProps> = ({ ldrState }) => {
    const { clients, policies, opportunities, users, systemSettings } = ldrState;

    const upcomingRenewals = policies.filter(p => {
        const renewalDate = new Date(p.endDate);
        const today = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(today.getDate() + 30);
        return renewalDate > today && renewalDate <= thirtyDaysFromNow && p.status === PolicyStatus.Active;
    });

    const policiesByType = policies.reduce((acc, policy) => {
        acc[policy.type] = (acc[policy.type] || 0) + 1;
        return acc;
    }, {} as Record<PolicyType, number>);

    const policiesChartData = Object.entries(policiesByType).map(([name, value]) => ({ name, value }));
    const PIE_COLORS = ['#0052CC', '#00B8D9', '#FFAB00', '#DE350B', '#5E6C84'];

    const totalPremium = policies.reduce((sum, p) => p.status === PolicyStatus.Active ? sum + p.premium : sum, 0);

    const formatCurrency = (value: number) => {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: systemSettings.currency });
    }

    const wonOpportunities = opportunities.filter(o => o.stage === 'Fechado Ganho').length;
    const lostOpportunities = opportunities.filter(o => o.stage === 'Fechado Perdido').length;

    const opportunitiesStatusData = [
        { name: 'Ganhos', value: wonOpportunities, fill: '#00875A' },
        { name: 'Perdidos', value: lostOpportunities, fill: '#DE350B' }
    ];

    const salesByPerson = opportunities.reduce((acc, opp) => {
        if (opp.stage === 'Fechado Ganho') {
            if (!acc[opp.salesperson]) {
                acc[opp.salesperson] = { wonValue: 0, wonCount: 0 };
            }
            acc[opp.salesperson].wonValue += opp.value;
            acc[opp.salesperson].wonCount += 1;
        }
        return acc;
    }, {} as Record<string, { wonValue: number, wonCount: number }>);

    const salesChartData = Object.entries(salesByPerson).map(([name, data]) => ({
        name: name.split(' ')[0],
        'Prêmio (R$)': data.wonValue,
        'Negócios': data.wonCount,
    }));


    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total de Clientes" value={clients.length} description="Clientes ativos na base" />
                <StatCard title="Apólices Ativas" value={policies.filter(p => p.status === PolicyStatus.Active).length} description="Contratos vigentes" />
                <StatCard title="Prêmio Anual Total" value={formatCurrency(totalPremium)} description="Soma dos prêmios ativos" />
                <StatCard title="Renovações (30d)" value={upcomingRenewals.length} description="Apólices vencendo em 30 dias" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-ui-card p-6 rounded-lg border border-ui-border shadow-sm">
                    <h3 className="font-bold text-text-primary mb-4">Distribuição de Apólices por Tipo</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={policiesChartData} cx="50%" cy="50%" labelLine={false} outerRadius={110} fill="#0052CC" dataKey="value" label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                {policiesChartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value) => `${value} apólices`} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-ui-card p-6 rounded-lg border border-ui-border shadow-sm">
                    <h3 className="font-bold text-text-primary mb-4">Oportunidades Ganhos vs. Perdidos</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={opportunitiesStatusData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" />
                            <YAxis type="category" dataKey="name" width={60} />
                            <Tooltip formatter={(value) => `${value} negócios`} />
                            <Bar dataKey="value" barSize={40}>
                                {opportunitiesStatusData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-ui-card p-6 rounded-lg border border-ui-border shadow-sm">
                    <h3 className="font-bold text-text-primary mb-4">Desempenho por Vendedor (Negócios Ganhos)</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={salesChartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis yAxisId="left" orientation="left" stroke="#0052CC" />
                            <YAxis yAxisId="right" orientation="right" stroke="#00875A" />
                            <Tooltip formatter={(value, name) => name === 'Prêmio (R$)' ? formatCurrency(Number(value)) : value} />
                            <Legend />
                            <Bar yAxisId="left" dataKey="Prêmio (R$)" fill="#0052CC" />
                            <Bar yAxisId="right" dataKey="Negócios" fill="#00875A" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-ui-card p-6 rounded-lg border border-ui-border shadow-sm">
                    <h3 className="font-bold text-text-primary mb-4">Apólices Recentes</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-ui-card">
                            <thead className="bg-ui-card">
                                <tr>
                                    <th className="py-2 px-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Cliente</th>
                                    <th className="py-2 px-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Tipo</th>
                                    <th className="py-2 px-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-ui-border">
                                {[...policies].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()).slice(0, 5).map(policy => (
                                    <tr key={policy.id}>
                                        <td className="py-3 px-4 whitespace-nowrap text-sm text-text-primary">{clients.find(c => c.id === policy.clientId)?.name}</td>
                                        <td className="py-3 px-4 whitespace-nowrap text-sm text-text-secondary">{policy.type}</td>
                                        <td className="py-3 px-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(policy.status)}`}>
                                                {policy.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;