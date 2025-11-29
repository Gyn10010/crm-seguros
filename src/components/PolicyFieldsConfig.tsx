import React, { useState, useEffect } from 'react';
import { PolicyFieldConfig } from '../types/index';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const POLICY_FIELDS = [
  { name: 'clientId', label: 'Cliente' },
  { name: 'documentType', label: 'Tipo Documento' },
  { name: 'startDate', label: 'Vigência Inicial' },
  { name: 'netPremium', label: 'Prêmio Líquido' },
  { name: 'commission', label: 'Comissão (%)' },
  { name: 'generatedCommission', label: 'Comissão Gerada' },
  { name: 'installments', label: 'Quantidade Parcelas' },
  { name: 'paymentType', label: 'Tipo Pagamento' },
  { name: 'insuranceCompany', label: 'Seguradora' },
  { name: 'branch', label: 'Ramo' },
  { name: 'product', label: 'Produto' },
  { name: 'status', label: 'Status' },
  { name: 'item', label: 'Item' },
  { name: 'proposal', label: 'Proposta' },
  { name: 'policyNumber', label: 'Apólice' },
  { name: 'endorsementProposal', label: 'Proposta Endosso' },
  { name: 'endorsement', label: 'Endosso' },
  { name: 'endDate', label: 'Vigência Final' },
  { name: 'sellerTransfer', label: 'Repasse Vendedor' },
  { name: 'premium', label: 'Prêmio Total' },
];

interface PolicyFieldsConfigProps {
  onClose: () => void;
}

export const PolicyFieldsConfig: React.FC<PolicyFieldsConfigProps> = ({ onClose }) => {
  const [fieldConfigs, setFieldConfigs] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    loadConfigurations();
  }, []);

  const loadConfigurations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      setUserId(user.id);

      const { data, error } = await supabase
        .from('policy_field_config')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      const configs: Record<string, boolean> = {};
      data?.forEach((config) => {
        configs[config.field_name] = config.is_required;
      });
      setFieldConfigs(configs);
    } catch (error) {
      console.error('Error loading field configs:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (fieldName: string, isRequired: boolean) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('policy_field_config')
        .upsert({
          user_id: userId,
          field_name: fieldName,
          is_required: isRequired,
        }, {
          onConflict: 'user_id,field_name'
        });

      if (error) throw error;

      setFieldConfigs(prev => ({ ...prev, [fieldName]: isRequired }));
      toast.success('Configuração atualizada');
    } catch (error) {
      console.error('Error updating field config:', error);
      toast.error('Erro ao atualizar configuração');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-ui-card p-8 rounded-lg border border-ui-border w-full max-w-2xl">
          <p className="text-text-primary">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-ui-card p-8 rounded-lg border border-ui-border w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-text-primary mb-6">
          Configurar Campos Obrigatórios
        </h2>
        <p className="text-text-secondary mb-6">
          Defina quais campos são obrigatórios ao cadastrar uma apólice
        </p>

        <div className="space-y-4">
          {POLICY_FIELDS.map((field) => (
            <div key={field.name} className="flex items-center justify-between p-4 border border-ui-border rounded-lg">
              <label htmlFor={field.name} className="text-sm font-medium text-text-primary">
                {field.label}
              </label>
              <Switch
                id={field.name}
                checked={fieldConfigs[field.name] || false}
                onCheckedChange={(checked) => handleToggle(field.name, checked)}
              />
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-4 pt-6 mt-6 border-t border-ui-border">
          <Button onClick={onClose} variant="default">
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
};
