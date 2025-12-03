import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ClientFieldsConfigProps {
  userId: string;
}

const CLIENT_FIELDS = [
  { name: 'name', label: 'Nome' },
  { name: 'email', label: 'E-mail' },
  { name: 'phone', label: 'Telefone' },
  { name: 'address', label: 'Endereço' },
  { name: 'city', label: 'Cidade' },
  { name: 'state', label: 'Estado' },
  { name: 'zipCode', label: 'CEP' },
  { name: 'personType', label: 'Tipo de Pessoa' },
  { name: 'document', label: 'CPF/CNPJ' },
  { name: 'birthDate', label: 'Data de Nascimento' },
  { name: 'gender', label: 'Gênero' },
  { name: 'maritalStatus', label: 'Estado Civil' },
  { name: 'profession', label: 'Profissão' },
  { name: 'monthlyIncome', label: 'Renda Mensal' },
  { name: 'businessSector', label: 'Setor de Atividade' },
  { name: 'licenseExpiry', label: 'Vencimento da CNH' },
  { name: 'salesperson', label: 'Vendedor' },
];

export function ClientFieldsConfig({ userId }: ClientFieldsConfigProps) {
  const [fieldConfigs, setFieldConfigs] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadFieldConfigs();
  }, [userId]);

  const loadFieldConfigs = async () => {
    try {
      console.log('Loading field configs for user:', userId);

      const { data, error } = await supabase
        .from('client_field_config')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Field configs loaded:', data);

      const configs: Record<string, boolean> = {};
      data?.forEach((config) => {
        configs[config.field_name] = config.is_required;
      });
      setFieldConfigs(configs);
    } catch (error: any) {
      console.error('Error loading field configs:', error);
      toast({
        title: 'Erro',
        description: `Erro ao carregar configurações de campos: ${error.message || 'Erro desconhecido'}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (fieldName: string, isRequired: boolean) => {
    try {
      console.log('Updating field config:', { userId, fieldName, isRequired });

      const { error } = await supabase
        .from('client_field_config')
        .upsert({
          user_id: userId,
          field_name: fieldName,
          is_required: isRequired,
        }, {
          onConflict: 'user_id,field_name',
        });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      setFieldConfigs((prev) => ({
        ...prev,
        [fieldName]: isRequired,
      }));

      toast({
        title: 'Sucesso',
        description: 'Configuração atualizada',
      });
    } catch (error: any) {
      console.error('Error updating field config:', error);
      toast({
        title: 'Erro',
        description: `Erro ao atualizar configuração: ${error.message || 'Erro desconhecido'}`,
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuração de Campos Obrigatórios - Clientes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {CLIENT_FIELDS.map((field) => (
          <div key={field.name} className="flex items-center justify-between">
            <Label htmlFor={field.name}>{field.label}</Label>
            <Switch
              id={field.name}
              checked={fieldConfigs[field.name] || false}
              onCheckedChange={(checked) => handleToggle(field.name, checked)}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
