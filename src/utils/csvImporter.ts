import { supabase } from "@/integrations/supabase/client";

interface PolicyData {
  clientName: string;
  policyNumber: string;
  insuranceCompany: string;
  type: string;
  premium: number;
  commission: number;
  startDate: string;
  endDate: string;
  status: string;
}

export async function importPoliciesFromCSV(csvContent: string, userId: string): Promise<{ success: number; errors: string[] }> {
  const lines = csvContent.split('\n');
  const policies: PolicyData[] = [];
  const errors: string[] = [];
  
  let currentPolicy: Partial<PolicyData> | null = null;
  let currentLine = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].replace(/^"|"$/g, '').trim();
    
    // Skip headers and empty lines
    if (!line || line.includes('RELATÓRIO DE PRODUÇÃO') || line.includes('TIPO        VIGÊNCIA')) {
      continue;
    }
    
    // Check if this is a new policy entry (starts with a name)
    const parts = line.split(/\s{2,}/);
    
    if (parts.length > 5 && (parts[1] === 'APÓLICE' || parts[1] === 'ENDOSSO')) {
      // Save previous policy if exists
      if (currentPolicy?.clientName && currentPolicy?.policyNumber) {
        policies.push(currentPolicy as PolicyData);
      }
      
      // Start new policy
      currentPolicy = {
        clientName: parts[0],
        status: parts[1] === 'APÓLICE' ? 'Ativa' : 'Endossada',
      };
      
      // Parse date (format: DD/MM/YYYY)
      const dateMatch = parts[2];
      if (dateMatch) {
        currentPolicy.startDate = convertDate(dateMatch);
      }
      
      // Parse premium
      const premiumMatch = parts[3]?.match(/R\$\s*([\d.,]+)/);
      if (premiumMatch) {
        currentPolicy.premium = parseFloat(premiumMatch[1].replace('.', '').replace(',', '.'));
      }
      
      // Parse commission
      const commissionMatch = parts[5]?.match(/R\$\s*([\d.,]+)/);
      if (commissionMatch) {
        currentPolicy.commission = parseFloat(commissionMatch[1].replace('.', '').replace(',', '.'));
      }
      
      // Find insurance company and type
      if (parts[8]) currentPolicy.insuranceCompany = parts[8];
      if (parts[9]) currentPolicy.type = parts[9];
      
      // Find policy number (usually in the middle of the line)
      const policyNumberMatch = line.match(/(\d{2}\.\d{4}\.\d{7}|\d{15,}|5177\d+)/);
      if (policyNumberMatch) {
        currentPolicy.policyNumber = policyNumberMatch[1];
      }
      
      // Find end date
      const endDateMatch = line.match(/(\d{2}\/\d{2}\/\d{4})/g);
      if (endDateMatch && endDateMatch.length > 1) {
        currentPolicy.endDate = convertDate(endDateMatch[endDateMatch.length - 1]);
      }
    }
  }
  
  // Add last policy
  if (currentPolicy?.clientName && currentPolicy?.policyNumber) {
    policies.push(currentPolicy as PolicyData);
  }
  
  // Now insert into database
  let successCount = 0;
  
  for (const policy of policies) {
    try {
      // First, check if client exists or create
      let clientId: string;
      
      const { data: existingClient } = await supabase
        .from('clients')
        .select('id')
        .eq('name', policy.clientName)
        .maybeSingle();
      
      if (existingClient) {
        clientId = existingClient.id;
      } else {
        // Create new client
        const { data: newClient, error: clientError } = await supabase
          .from('clients')
          .insert({
            name: policy.clientName,
            email: `${policy.clientName.toLowerCase().replace(/\s+/g, '.')}@cliente.com`,
            phone: '(00) 00000-0000',
            address: 'Endereço a ser atualizado',
            user_id: userId
          })
          .select()
          .single();
        
        if (clientError || !newClient) {
          errors.push(`Erro ao criar cliente ${policy.clientName}: ${clientError?.message}`);
          continue;
        }
        
        clientId = newClient.id;
      }
      
      // Insert policy
      const { error: policyError } = await supabase
        .from('policies')
        .insert({
          client_id: clientId,
          user_id: userId,
          policy_number: policy.policyNumber,
          type: policy.type || 'Outros',
          insurance_company: policy.insuranceCompany || 'N/A',
          premium: policy.premium || 0,
          commission: policy.commission || 0,
          start_date: policy.startDate,
          end_date: policy.endDate,
          status: policy.status || 'Ativa'
        });
      
      if (policyError) {
        errors.push(`Erro ao inserir apólice ${policy.policyNumber}: ${policyError.message}`);
      } else {
        successCount++;
      }
      
    } catch (error) {
      errors.push(`Erro ao processar apólice: ${error}`);
    }
  }
  
  return { success: successCount, errors };
}

function convertDate(dateStr: string): string {
  // Convert DD/MM/YYYY to YYYY-MM-DD
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
}
