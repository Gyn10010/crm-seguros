import React from 'react';
import { Page, User } from '../types/index';
import { DashboardIcon, ClientsIcon, PoliciesIcon, TaskIcon, LogoutIcon, RenewalIcon, SettingsIcon, InsuranceCompanyIcon, FunnelIcon } from './icons/Icons';

interface HeaderProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  onLogoutRequest: () => void;
  currentUser: User;
  companyName: string;
}

const Header: React.FC<HeaderProps> = ({ currentPage, setCurrentPage, onLogoutRequest, currentUser, companyName }) => {
  const allNavItems = [
    { page: Page.Dashboard, label: 'Dashboard', icon: <DashboardIcon /> },
    { page: Page.Clients, label: 'Clientes', icon: <ClientsIcon /> },
    { page: Page.Policies, label: 'Apólices', icon: <PoliciesIcon /> },
    { page: Page.InsuranceCompanies, label: 'Seguradoras', icon: <InsuranceCompanyIcon /> },
    { page: Page.Renewals, label: 'Renovações', icon: <RenewalIcon /> },
    { page: Page.Tasks, label: 'Tarefas', icon: <TaskIcon /> },
    { page: Page.SalesFunnel, label: 'Funil de Vendas', icon: <FunnelIcon /> },
    { page: Page.Settings, label: 'Configurações', icon: <SettingsIcon /> },
  ];

  // If user has permissions array with items, show only those. Otherwise show everything (for admins)
  const visibleNavItems = currentUser.permissions.length > 0 
    ? allNavItems.filter(item => currentUser.permissions.includes(item.page))
    : allNavItems;

  const getInitials = (name: string) => {
    if (!name) return '';
    const names = name.split(' ');
    if (names.length > 1 && names[1]) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <header className="w-full bg-ui-card text-text-primary flex items-center justify-between border-b border-ui-border p-4 shadow-sm">
      <div className="flex items-center gap-8">
        <div className="text-center">
            <h1 className="text-2xl font-bold tracking-wider text-brand-primary">{companyName}</h1>
        </div>
        <nav>
          <ul className="flex items-center gap-2">
            {visibleNavItems.map(item => (
              <li key={item.page}>
                <button
                  onClick={() => setCurrentPage(item.page)}
                  title={item.label}
                  className={`p-3 rounded-md transition-colors duration-200 ${
                    currentPage === item.page
                      ? 'bg-brand-primary/10 text-brand-primary'
                      : 'text-text-secondary hover:bg-ui-hover hover:text-text-primary'
                  }`}
                >
                  {item.icon}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-full bg-brand-primary flex items-center justify-center font-bold text-sm cursor-default overflow-hidden shrink-0"
          >
            {currentUser.avatarUrl ? (
              <img src={currentUser.avatarUrl} alt={currentUser.name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-white">{getInitials(currentUser.name)}</span>
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-text-primary">{currentUser.name}</span>
            <span className="text-xs text-text-secondary">{currentUser.role}</span>
          </div>
        </div>
        <button
          onClick={onLogoutRequest}
          className="p-2 rounded-full hover:bg-ui-hover text-text-secondary hover:text-danger"
          title="Sair"
        >
          <LogoutIcon />
        </button>
      </div>
    </header>
  );
};

export default Header;