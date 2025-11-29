import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Upload, CheckCircle, XCircle, FileSpreadsheet, File } from "lucide-react";
import { importClientsFromCSV } from "@/utils/clientCsvImporter";
import { importClientsFromExcel } from "@/utils/clientExcelImporter";
import { supabase } from "@/integrations/supabase/client";

export function ImportClients() {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ success: number; errors: string[] } | null>(null);
  const [detectedFormat, setDetectedFormat] = useState<string>('');
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setResult(null);
      
      // Detect file format
      const extension = selectedFile.name.split('.').pop()?.toLowerCase();
      if (extension === 'csv') {
        setDetectedFormat('CSV');
      } else if (extension === 'xlsx' || extension === 'xls') {
        setDetectedFormat('Excel');
      } else {
        setDetectedFormat('Não suportado');
      }
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um arquivo",
        variant: "destructive",
      });
      return;
    }

    setImporting(true);
    setResult(null);

    try {
      console.log('Iniciando importação...', file.name);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Erro",
          description: "Usuário não autenticado",
          variant: "destructive",
        });
        setImporting(false);
        return;
      }

      console.log('Usuário autenticado:', user.id);

      const extension = file.name.split('.').pop()?.toLowerCase();
      let importResult;

      // Import based on file type
      if (extension === 'csv') {
        console.log('Importando CSV...');
        const content = await file.text();
        importResult = await importClientsFromCSV(content, user.id);
      } else if (extension === 'xlsx' || extension === 'xls') {
        console.log('Importando Excel...');
        importResult = await importClientsFromExcel(file, user.id);
      } else {
        toast({
          title: "Formato não suportado",
          description: "Por favor, use arquivos CSV ou Excel (.xlsx, .xls)",
          variant: "destructive",
        });
        setImporting(false);
        return;
      }
      
      console.log('Resultado da importação:', importResult);
      
      if (!importResult) {
        throw new Error('Nenhum resultado retornado da importação');
      }
      
      setResult(importResult);
      
      if (importResult.success > 0) {
        toast({
          title: "Importação concluída",
          description: `${importResult.success} clientes importados com sucesso!`,
        });
      }
      
      if (importResult.errors.length > 0) {
        toast({
          title: "Avisos durante importação",
          description: `${importResult.errors.length} erros encontrados`,
          variant: "destructive",
        });
      }
      
      if (importResult.success === 0 && importResult.errors.length === 0) {
        toast({
          title: "Nenhum cliente importado",
          description: "Verifique se o arquivo está no formato correto",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro na importação:', error);
      toast({
        title: "Erro na importação",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      console.log('Finalizando importação...');
      setImporting(false);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Importar Clientes</CardTitle>
        <CardDescription>
          Faça upload de arquivo CSV ou Excel com os dados dos clientes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">
              <Upload className="mr-2 h-4 w-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="csv">
              <File className="mr-2 h-4 w-4" />
              CSV
            </TabsTrigger>
            <TabsTrigger value="excel">
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Excel
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file-upload">Arquivo</Label>
              <Input
                id="file-upload"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                disabled={importing}
              />
              {detectedFormat && (
                <p className="text-sm text-muted-foreground">
                  Formato detectado: <span className="font-medium">{detectedFormat}</span>
                </p>
              )}
            </div>

            <Button
              onClick={handleImport}
              disabled={!file || importing}
              className="w-full"
            >
              <Upload className="mr-2 h-4 w-4" />
              {importing ? "Importando..." : "Importar Clientes"}
            </Button>

            {result && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">{result.success} clientes importados</span>
                </div>
                
                {result.errors.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-red-600">
                      <XCircle className="h-5 w-5" />
                      <span className="font-medium">{result.errors.length} erros encontrados</span>
                    </div>
                    <div className="max-h-40 overflow-y-auto text-sm text-muted-foreground">
                      {result.errors.slice(0, 10).map((error, idx) => (
                        <div key={idx} className="py-1">• {error}</div>
                      ))}
                      {result.errors.length > 10 && (
                        <div className="py-1 italic">... e mais {result.errors.length - 10} erros</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="csv" className="space-y-2">
            <h3 className="font-medium">Formato CSV</h3>
            <p className="text-sm text-muted-foreground">
              O arquivo CSV deve conter as seguintes colunas (obrigatórias em negrito):
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
              <li><strong>nome</strong> - Nome completo do cliente</li>
              <li><strong>email</strong> - Endereço de e-mail</li>
              <li><strong>telefone</strong> - Número de telefone</li>
              <li><strong>endereço</strong> - Endereço completo</li>
              <li>tipo pessoa - Física ou Jurídica</li>
              <li>documento - CPF ou CNPJ</li>
              <li>cidade, estado, cep</li>
              <li>vendedor, data nascimento, sexo, estado civil</li>
              <li>profissão, ramo, renda mensal, vencimento cnh</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-2">
              Use ponto e vírgula (;) ou vírgula (,) como separador.
            </p>
          </TabsContent>

          <TabsContent value="excel" className="space-y-2">
            <h3 className="font-medium">Formato Excel (.xlsx, .xls)</h3>
            <p className="text-sm text-muted-foreground">
              A planilha deve conter as mesmas colunas do formato CSV:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
              <li><strong>Primeira linha:</strong> Cabeçalhos das colunas</li>
              <li><strong>Linhas seguintes:</strong> Dados dos clientes</li>
              <li>Use a primeira aba da planilha para os dados</li>
              <li>Campos obrigatórios: nome, email, telefone, endereço</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-2">
              ✓ Suporta .xlsx e .xls<br />
              ✓ Apenas a primeira aba será processada
            </p>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
