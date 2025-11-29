import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';

interface ClientData {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  personType?: string;
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

export async function importClientsFromExcel(
  file: File,
  userId: string
): Promise<{ success: number; errors: string[] }> {
  const errors: string[] = [];
  let successCount = 0;

  try {
    // Read file
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    // Get first worksheet
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    
    if (data.length < 2) {
      errors.push('Planilha vazia ou sem dados');
      return { success: 0, errors };
    }

    // Get headers from first row
    const headers = data[0].map((h: any) => 
      String(h || '').toLowerCase().trim()
    );

    // Process each row (skip header)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      if (!row || row.every((cell: any) => !cell)) {
        continue; // Skip empty rows
      }

      try {
        const clientData: ClientData = {
          name: '',
        };

        // Map columns to fields
        headers.forEach((header: string, index: number) => {
          const value = row[index];
          if (!value && value !== 0) return;

          const strValue = String(value).trim();

          // Name variations
          if (header.includes('nome') || header === 'name') {
            clientData.name = strValue;
          }
          // Email
          else if (header.includes('email') || header.includes('e-mail')) {
            clientData.email = strValue;
          }
          // Phone variations
          else if (header.includes('telefone') || header.includes('celular') || 
                   header.includes('phone') || header.includes('tel')) {
            clientData.phone = strValue;
          }
          // Address variations
          else if (header.includes('endereço') || header.includes('endereco') || 
                   header === 'address' || header.includes('rua')) {
            clientData.address = strValue;
          }
          // Person type
          else if (header.includes('tipo') && header.includes('pessoa')) {
            clientData.personType = strValue;
          }
          // Document (CPF/CNPJ)
          else if (header.includes('documento') || header.includes('cpf') || 
                   header.includes('cnpj') || header === 'document') {
            clientData.document = strValue;
          }
          // City
          else if (header.includes('cidade') || header === 'city') {
            clientData.city = strValue;
          }
          // State
          else if (header.includes('estado') || header === 'uf' || header === 'state') {
            clientData.state = strValue;
          }
          // ZIP code
          else if (header.includes('cep') || header === 'zip' || header.includes('postal')) {
            clientData.zipCode = strValue;
          }
          // Salesperson
          else if (header.includes('vendedor') || header.includes('corretor') || 
                   header === 'salesperson') {
            clientData.salesperson = strValue;
          }
          // Birth date
          else if (header.includes('nascimento') || header.includes('birth') || 
                   header.includes('data nasc')) {
            clientData.birthDate = convertDate(strValue);
          }
          // Gender
          else if (header.includes('sexo') || header === 'gender') {
            clientData.gender = strValue;
          }
          // Marital status
          else if (header.includes('estado civil') || header.includes('marital')) {
            clientData.maritalStatus = strValue;
          }
          // Profession
          else if (header.includes('profissão') || header.includes('profissao') || 
                   header === 'profession') {
            clientData.profession = strValue;
          }
          // Business sector
          else if (header.includes('ramo') || header.includes('setor') || 
                   header.includes('business')) {
            clientData.businessSector = strValue;
          }
          // Monthly income
          else if (header.includes('renda') || header.includes('income')) {
            const numValue = parseFloat(String(value).replace(/[^\d.,-]/g, '').replace(',', '.'));
            if (!isNaN(numValue)) {
              clientData.monthlyIncome = numValue;
            }
          }
          // License expiry
          else if (header.includes('vencimento') && header.includes('cnh')) {
            clientData.licenseExpiry = convertDate(strValue);
          }
        });

        // Validate required fields
        if (!clientData.name) {
          errors.push(`Linha ${i + 1}: Campo obrigatório faltando (nome)`);
          continue;
        }

        // Prepare insert data - omit problematic fields with constraints for now
        const insertData: any = {
          user_id: userId,
          name: clientData.name,
        };

        // Only add optional fields if they have values
        if (clientData.email) insertData.email = clientData.email;
        if (clientData.phone) insertData.phone = clientData.phone;
        if (clientData.address) insertData.address = clientData.address;
        if (clientData.document) insertData.document = clientData.document;
        if (clientData.city) insertData.city = clientData.city;
        if (clientData.state) insertData.state = clientData.state;
        if (clientData.zipCode) insertData.zip_code = clientData.zipCode;
        if (clientData.salesperson) insertData.salesperson = clientData.salesperson;
        if (clientData.birthDate) insertData.birth_date = clientData.birthDate;
        if (clientData.maritalStatus) insertData.marital_status = clientData.maritalStatus;
        if (clientData.profession) insertData.profession = clientData.profession;
        if (clientData.businessSector) insertData.business_sector = clientData.businessSector;
        if (clientData.monthlyIncome) insertData.monthly_income = clientData.monthlyIncome;
        if (clientData.licenseExpiry) insertData.license_expiry = clientData.licenseExpiry;
        
        // Skip person_type and gender for now as they have validation constraints
        // TODO: Map values to match database constraints

        // Insert into database
        const { error: insertError } = await supabase
          .from('clients')
          .insert(insertData);

        if (insertError) {
          errors.push(`Linha ${i + 1}: ${insertError.message}`);
        } else {
          successCount++;
        }
      } catch (rowError) {
        errors.push(`Linha ${i + 1}: ${rowError instanceof Error ? rowError.message : 'Erro desconhecido'}`);
      }
    }
  } catch (error) {
    errors.push(`Erro ao processar Excel: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }

  return { success: successCount, errors };
}

function convertDate(dateStr: string): string | undefined {
  if (!dateStr) return undefined;
  
  // Try DD/MM/YYYY format
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  
  // Try to parse as date
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }
  
  return undefined;
}
