import React, { useState, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { supabase } from '@/integrations/supabase/client';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { Analytics } from "@vercel/analytics/react";
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import ClientList from './components/ClientList';
import PolicyList from './components/PolicyList';
import KanbanBoard from './components/KanbanBoard';
import Renewals from './components/Renewals';
import Settings from './components/Settings';
import useLDRState from './hooks/useLDRState';
import { Page, User } from './types/index';
import LogoutModal from './components/LogoutModal';
import AlertModal from './components/AlertModal';
import InsuranceCompanies from './components/InsuranceCompanies';
import SalesFunnel from './components/SalesFunnel';
import Auth from './components/Auth';

const queryClient = new QueryClient();

function AppContent() {
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>(Page.Dashboard);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [alertModalMessage, setAlertModalMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const ldrState = useLDRState();

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setSupabaseUser(session?.user ?? null);
      if (session?.user) {
        loadUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setSupabaseUser(session?.user ?? null);
      if (session?.user) {
        loadUserProfile(session.user.id);
      } else {
        setCurrentUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        // Check if user is admin
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .eq('role', 'admin')
          .maybeSingle();

        const userIsAdmin = !!roleData;
        setIsAdmin(userIsAdmin);

        setCurrentUser({
          id: data.id,
          name: data.name,
          email: data.email,
          role: (data.role === 'Gestor' || data.role === 'Vendedor') ? data.role : 'Vendedor',
          permissions: userIsAdmin ? Object.values(Page) : [],
          avatarUrl: data.avatar_url || '',
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      document.documentElement.style.setProperty('--brand-primary', ldrState.systemSettings.themeColor);
    }
  }, [ldrState.systemSettings.themeColor, currentUser]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsLogoutModalOpen(false);
    setCurrentUser(null);
    setSupabaseUser(null);
    setSession(null);
  };

  const showAlert = (message: string) => {
    setAlertModalMessage(message);
    setIsAlertModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ui-background">
        <div className="text-text-primary">Carregando...</div>
      </div>
    );
  }

  if (!supabaseUser || !currentUser) {
    return <Auth />;
  }

  const renderContent = () => {
    switch (currentPage) {
      case Page.Dashboard:
        return <Dashboard ldrState={ldrState} />;
      case Page.Clients:
        return <ClientList ldrState={ldrState} />;
      case Page.Policies:
        return <PolicyList ldrState={ldrState} />;
      case Page.InsuranceCompanies:
        return <InsuranceCompanies ldrState={ldrState} />;
      case Page.Tasks:
        return <KanbanBoard ldrState={ldrState} />;
      case Page.Renewals:
        return <Renewals ldrState={ldrState} />;
      case Page.SalesFunnel:
        return <SalesFunnel ldrState={ldrState} showAlert={showAlert} />;
      case Page.Settings:
        return <Settings ldrState={ldrState} isAdmin={isAdmin} />;
      default:
        return <Dashboard ldrState={ldrState} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-ui-background">
      <Header
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        onLogoutRequest={() => setIsLogoutModalOpen(true)}
        currentUser={currentUser}
        companyName={ldrState.systemSettings.companyName}
        pageTitle={(() => {
          switch (currentPage) {
            case Page.Dashboard: return 'Dashboard';
            case Page.Clients: return 'Clientes';
            case Page.Policies: return 'Apólices';
            case Page.InsuranceCompanies: return 'Seguradoras';
            case Page.Tasks: return 'Tarefas';
            case Page.Renewals: return 'Renovações';
            case Page.SalesFunnel: return 'Funil de Vendas';
            case Page.Settings: return 'Configurações';
            default: return undefined;
          }
        })()}
      />
      <main className="flex-1">
        <div className={currentPage === Page.SalesFunnel ? 'flex flex-col overflow-hidden h-full' : ''}>
          {renderContent()}
        </div>
      </main>

      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogout}
      />

      <AlertModal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        message={alertModalMessage}
      />
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppContent />
      <Analytics />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
