import { useState, useCallback } from 'react';
import { Policy, PolicyStatus, InsuranceCompanyContact } from '../types/index';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const usePolicies = () => {
    const [policies, setPolicies] = useState<Policy[]>([]);
    const [policyTypes, setPolicyTypes] = useState<string[]>([]);
    const [insuranceCompanyContacts, setInsuranceCompanyContacts] = useState<InsuranceCompanyContact[]>([]);

    // Policy Management
    const addPolicy = useCallback(async (policyData: Omit<Policy, 'id'>) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error('Usuário não autenticado');
                return;
            }

            const { data, error } = await supabase
                .from('policies')
                .insert({
                    client_id: policyData.clientId,
                    policy_number: policyData.policyNumber,
                    insurance_company: policyData.insuranceCompany,
                    type: policyData.type,
                    premium: policyData.premium,
                    commission: policyData.commission,
                    start_date: policyData.startDate,
                    end_date: policyData.endDate,
                    status: policyData.status,
                    user_id: user.id
                })
                .select()
                .single();

            if (error) throw error;

            if (data) {
                const newPolicy: Policy = {
                    id: data.id,
                    clientId: data.client_id,
                    policyNumber: data.policy_number,
                    insuranceCompany: data.insurance_company,
                    type: data.type,
                    premium: data.premium,
                    commission: data.commission,
                    startDate: data.start_date,
                    endDate: data.end_date,
                    status: data.status as PolicyStatus,
                };
                setPolicies(prev => [...prev, newPolicy]);
                toast.success('Apólice adicionada com sucesso!');
            }
        } catch (error) {
            console.error('Error adding policy:', error);
            toast.error('Erro ao adicionar apólice');
        }
    }, []);

    const updatePolicy = useCallback(async (updatedPolicy: Policy) => {
        try {
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

            if (error) throw error;

            setPolicies(prev => prev.map(p => p.id === updatedPolicy.id ? updatedPolicy : p));
            toast.success('Apólice atualizada com sucesso!');
        } catch (error) {
            console.error('Error updating policy:', error);
            toast.error('Erro ao atualizar apólice');
        }
    }, []);

    const deletePolicy = useCallback(async (policyId: string) => {
        try {
            const { error } = await supabase
                .from('policies')
                .delete()
                .eq('id', policyId);

            if (error) throw error;

            setPolicies(prev => prev.filter(p => p.id !== policyId));
            toast.success('Apólice excluída com sucesso!');
        } catch (error) {
            console.error('Error deleting policy:', error);
            toast.error('Erro ao excluir apólice');
        }
    }, []);

    // Policy Types Management
    const addPolicyType = useCallback(async (policyType: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error('Usuário não autenticado');
                return;
            }

            const { error } = await supabase
                .from('policy_types')
                .insert({ name: policyType, user_id: user.id });

            if (error) throw error;

            setPolicyTypes(prev => [...prev, policyType]);
            toast.success('Tipo de apólice adicionado!');
        } catch (error) {
            console.error('Error adding policy type:', error);
            toast.error('Erro ao adicionar tipo de apólice');
        }
    }, []);

    const deletePolicyType = useCallback(async (policyType: string) => {
        try {
            const { error } = await supabase
                .from('policy_types')
                .delete()
                .eq('name', policyType);

            if (error) throw error;

            setPolicyTypes(prev => prev.filter(t => t !== policyType));
            toast.success('Tipo de apólice removido!');
        } catch (error) {
            console.error('Error deleting policy type:', error);
            toast.error('Erro ao remover tipo de apólice');
        }
    }, []);

    // Insurance Company Contacts Management
    const addInsuranceCompanyContact = useCallback(async (companyData: Omit<InsuranceCompanyContact, 'id'>) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error('Usuário não autenticado');
                return;
            }

            const { data, error } = await supabase
                .from('insurance_companies')
                .insert({
                    name: companyData.name,
                    contact_person: companyData.contactPerson,
                    phone: companyData.phone,
                    email: companyData.email,
                    portal_url: companyData.portalUrl,
                    user_id: user.id
                })
                .select()
                .single();

            if (error) throw error;

            if (data) {
                const newCompany: InsuranceCompanyContact = {
                    id: data.id,
                    name: data.name,
                    contactPerson: data.contact_person,
                    phone: data.phone,
                    email: data.email,
                    credentials: [], // Credentials handled separately if needed
                    portalUrl: data.portal_url
                };
                setInsuranceCompanyContacts(prev => [...prev, newCompany]);
                toast.success('Seguradora adicionada com sucesso!');
            }
        } catch (error) {
            console.error('Error adding insurance company:', error);
            toast.error('Erro ao adicionar seguradora');
        }
    }, []);

    const updateInsuranceCompanyContact = useCallback(async (updatedCompany: InsuranceCompanyContact) => {
        try {
            const { error } = await supabase
                .from('insurance_companies')
                .update({
                    name: updatedCompany.name,
                    contact_person: updatedCompany.contactPerson,
                    phone: updatedCompany.phone,
                    email: updatedCompany.email,
                    portal_url: updatedCompany.portalUrl
                })
                .eq('id', updatedCompany.id);

            if (error) throw error;

            setInsuranceCompanyContacts(prev => prev.map(c => c.id === updatedCompany.id ? updatedCompany : c));
            toast.success('Seguradora atualizada com sucesso!');
        } catch (error) {
            console.error('Error updating insurance company:', error);
            toast.error('Erro ao atualizar seguradora');
        }
    }, []);

    const deleteInsuranceCompanyContact = useCallback(async (companyId: string) => {
        try {
            const { error } = await supabase
                .from('insurance_companies')
                .delete()
                .eq('id', companyId);

            if (error) throw error;

            setInsuranceCompanyContacts(prev => prev.filter(c => c.id !== companyId));
            toast.success('Seguradora excluída com sucesso!');
        } catch (error) {
            console.error('Error deleting insurance company:', error);
            toast.error('Erro ao excluir seguradora');
        }
    }, []);

    return {
        policies,
        setPolicies,
        policyTypes,
        setPolicyTypes,
        insuranceCompanyContacts,
        setInsuranceCompanyContacts,
        addPolicy,
        updatePolicy,
        deletePolicy,
        addPolicyType,
        deletePolicyType,
        addInsuranceCompanyContact,
        updateInsuranceCompanyContact,
        deleteInsuranceCompanyContact
    };
};
