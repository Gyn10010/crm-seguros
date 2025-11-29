import * as pdfjsLib from 'pdfjs-dist';
import { supabase } from '@/integrations/supabase/client';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface ClientData {
  name: string;
  email: string;
  phone: string;
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

export async function importClientsFromPDF(
  file: File,
  userId: string
): Promise<{ success: number; errors: string[] }> {
  const errors: string[] = [];
  let successCount = 0;

  try {
    // Read PDF file
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    // Extract text from all pages
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map((item: any) => item.str).join(' ');
      text += pageText + '\n';
    }
    
    if (!text || text.trim().length === 0) {
      errors.push('PDF vazio ou sem texto extraível');
      return { success: 0, errors };
    }

    // Try to extract table data
    // This is a simple approach - assumes data is in a tabular format with clear delimiters
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      errors.push('PDF não contém dados suficientes em formato de tabela');
      return { success: 0, errors };
    }

    // Try to identify header row (contains common field names)
    let headerIndex = -1;
    const headerKeywords = ['nome', 'email', 'telefone', 'endereço', 'endereco'];
    
    for (let i = 0; i < Math.min(lines.length, 10); i++) {
      const lineLower = lines[i].toLowerCase();
      const matchCount = headerKeywords.filter(keyword => lineLower.includes(keyword)).length;
      if (matchCount >= 3) {
        headerIndex = i;
        break;
      }
    }

    if (headerIndex === -1) {
      errors.push('Não foi possível identificar o cabeçalho da tabela no PDF. Certifique-se de que o PDF contém uma tabela com as colunas: nome, email, telefone, endereço');
      return { success: 0, errors };
    }

    // Extract headers
    const headerLine = lines[headerIndex];
    const headers = headerLine
      .split(/\s{2,}|\t/) // Split by multiple spaces or tabs
      .map(h => h.toLowerCase().trim())
      .filter(h => h);

    // Process data rows
    for (let i = headerIndex + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (!line || line.length < 10) {
        continue; // Skip short or empty lines
      }

      try {
        // Split by multiple spaces or tabs (common in PDF tables)
        const values = line.split(/\s{2,}|\t/).map(v => v.trim()).filter(v => v);
        
        if (values.length < 4) {
          continue; // Need at least 4 required fields
        }

        const clientData: ClientData = {
          name: '',
          email: '',
          phone: '',
        };

        // Map values to fields based on header positions
        headers.forEach((header: string, index: number) => {
          const value = values[index];
          if (!value) return;

          // Name
          if (header.includes('nome') || header === 'name') {
            clientData.name = value;
          }
          // Email
          else if (header.includes('email') || header.includes('e-mail')) {
            clientData.email = value;
          }
          // Phone
          else if (header.includes('telefone') || header.includes('celular') || 
                   header.includes('phone') || header.includes('tel')) {
            clientData.phone = value;
          }
          // Address
          else if (header.includes('endereço') || header.includes('endereco') || 
                   header === 'address' || header.includes('rua')) {
            clientData.address = value;
          }
          // Person type
          else if (header.includes('tipo') && header.includes('pessoa')) {
            clientData.personType = value;
          }
          // Document
          else if (header.includes('documento') || header.includes('cpf') || 
                   header.includes('cnpj')) {
            clientData.document = value;
          }
          // City
          else if (header.includes('cidade') || header === 'city') {
            clientData.city = value;
          }
          // State
          else if (header.includes('estado') || header === 'uf' || header === 'state') {
            clientData.state = value;
          }
          // ZIP code
          else if (header.includes('cep') || header === 'zip') {
            clientData.zipCode = value;
          }
          // Salesperson
          else if (header.includes('vendedor') || header.includes('corretor')) {
            clientData.salesperson = value;
          }
          // Birth date
          else if (header.includes('nascimento') || header.includes('birth')) {
            clientData.birthDate = convertDate(value);
          }
          // Gender
          else if (header.includes('sexo') || header === 'gender') {
            clientData.gender = value;
          }
          // Marital status
          else if (header.includes('estado civil') || header.includes('marital')) {
            clientData.maritalStatus = value;
          }
          // Profession
          else if (header.includes('profissão') || header.includes('profissao')) {
            clientData.profession = value;
          }
          // Business sector
          else if (header.includes('ramo') || header.includes('setor')) {
            clientData.businessSector = value;
          }
          // Monthly income
          else if (header.includes('renda') || header.includes('income')) {
            const numValue = parseFloat(value.replace(/[^\d.,-]/g, '').replace(',', '.'));
            if (!isNaN(numValue)) {
              clientData.monthlyIncome = numValue;
            }
          }
          // License expiry
          else if (header.includes('vencimento') && header.includes('cnh')) {
            clientData.licenseExpiry = convertDate(value);
          }
        });

        // Validate required fields
        if (!clientData.name) {
          errors.push(`Linha ${i + 1}: Campo obrigatório faltando (nome)`);
          continue;
        }

        // Insert into database
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
          });

        if (insertError) {
          errors.push(`Linha ${i + 1}: ${insertError.message}`);
        } else {
          successCount++;
        }
      } catch (rowError) {
        errors.push(`Linha ${i + 1}: ${rowError instanceof Error ? rowError.message : 'Erro desconhecido'}`);
      }
    }

    if (successCount === 0 && errors.length === 0) {
      errors.push('Nenhum dado válido encontrado no PDF. Certifique-se de que o PDF contém uma tabela estruturada com as colunas necessárias.');
    }
  } catch (error) {
    errors.push(`Erro ao processar PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
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
