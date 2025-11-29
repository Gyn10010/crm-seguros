import { supabase } from "@/integrations/supabase/client";

interface ClientData {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  personType?: 'Física' | 'Jurídica';
  document?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  salesperson?: string;
  birthDate?: string;
  gender?: string;
  maritalStatus?: string;
  profession?: string;
  businessSector?: string;
  monthlyIncome?: number;
  licenseExpiry?: string;
}

export async function importClientsFromCSV(
  csvContent: string,
  userId: string
): Promise<{ success: number; errors: string[] }> {
  const errors: string[] = [];
  let successCount = 0;

  try {
    // Parse CSV content
    const lines = csvContent.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      errors.push('Arquivo CSV vazio ou sem dados');
      return { success: 0, errors };
    }

    // Get header
    const header = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    // Process each line
    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(',').map(v => v.trim());
        
        if (values.length < 4) {
          errors.push(`Linha ${i + 1}: Dados insuficientes`);
          continue;
        }

        const clientData: ClientData = {
          name: '',
        };

        // Map CSV columns to client data
        header.forEach((col, idx) => {
          const value = values[idx] || '';
          
          switch (col) {
            case 'nome':
            case 'name':
              clientData.name = value;
              break;
            case 'email':
            case 'e-mail':
              clientData.email = value;
              break;
            case 'telefone':
            case 'phone':
            case 'tel':
              clientData.phone = value;
              break;
            case 'endereço':
            case 'endereco':
            case 'address':
              clientData.address = value;
              break;
            case 'tipo':
            case 'tipo pessoa':
            case 'person_type':
              clientData.personType = value === 'Jurídica' ? 'Jurídica' : 'Física';
              break;
            case 'cpf':
            case 'cnpj':
            case 'documento':
            case 'document':
              clientData.document = value;
              break;
            case 'cidade':
            case 'city':
              clientData.city = value;
              break;
            case 'estado':
            case 'uf':
            case 'state':
              clientData.state = value;
              break;
            case 'cep':
            case 'zip':
            case 'zipcode':
              clientData.zipCode = value;
              break;
            case 'vendedor':
            case 'salesperson':
              clientData.salesperson = value;
              break;
            case 'data nascimento':
            case 'nascimento':
            case 'birth_date':
              if (value) {
                clientData.birthDate = convertDate(value);
              }
              break;
            case 'sexo':
            case 'genero':
            case 'gender':
              clientData.gender = value;
              break;
            case 'estado civil':
            case 'marital_status':
              clientData.maritalStatus = value;
              break;
            case 'profissao':
            case 'profession':
              clientData.profession = value;
              break;
            case 'ramo':
            case 'setor':
            case 'business_sector':
              clientData.businessSector = value;
              break;
            case 'renda':
            case 'renda mensal':
            case 'monthly_income':
              if (value) {
                clientData.monthlyIncome = parseFloat(value.replace(/[^\d.-]/g, ''));
              }
              break;
            case 'vencimento cnh':
            case 'cnh':
            case 'license_expiry':
              if (value) {
                clientData.licenseExpiry = convertDate(value);
              }
              break;
          }
        });

        // Validate required fields
        if (!clientData.name) {
          errors.push(`Linha ${i + 1}: Campo obrigatório faltando (nome)`);
          continue;
        }

        // Insert client
        const { error: insertError } = await supabase
          .from('clients')
          .insert({
            user_id: userId,
            name: clientData.name,
            email: clientData.email,
            phone: clientData.phone,
            address: clientData.address,
            person_type: clientData.personType,
            document: clientData.document,
            city: clientData.city,
            state: clientData.state,
            zip_code: clientData.zipCode,
            salesperson: clientData.salesperson,
            birth_date: clientData.birthDate,
            gender: clientData.gender,
            marital_status: clientData.maritalStatus,
            profession: clientData.profession,
            business_sector: clientData.businessSector,
            monthly_income: clientData.monthlyIncome,
            license_expiry: clientData.licenseExpiry,
            is_active: true,
          });

        if (insertError) {
          errors.push(`Linha ${i + 1}: ${insertError.message}`);
        } else {
          successCount++;
        }
      } catch (error) {
        errors.push(`Linha ${i + 1}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    }
  } catch (error) {
    errors.push(`Erro ao processar CSV: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }

  return { success: successCount, errors };
}

function convertDate(dateStr: string): string {
  // Try to convert DD/MM/YYYY to YYYY-MM-DD
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
  }
  return dateStr;
}
