import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, CheckCircle, XCircle } from "lucide-react";
import { importPoliciesFromCSV } from "@/utils/csvImporter";
import { supabase } from "@/integrations/supabase/client";

export function ImportCSV() {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ success: number; errors: string[] } | null>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um arquivo CSV",
        variant: "destructive",
      });
      return;
    }

    setImporting(true);
    setResult(null);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Erro",
          description: "Usuário não autenticado",
          variant: "destructive",
        });
        return;
      }

      // Read file content
      const content = await file.text();
      
      // Import policies
      const importResult = await importPoliciesFromCSV(content, user.id);
      
      setResult(importResult);
      
      if (importResult.success > 0) {
        toast({
          title: "Importação concluída",
          description: `${importResult.success} apólices importadas com sucesso!`,
        });
      }
      
      if (importResult.errors.length > 0) {
        toast({
          title: "Avisos durante importação",
          description: `${importResult.errors.length} erros encontrados`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro na importação",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Importar Apólices via CSV</CardTitle>
        <CardDescription>
          Faça upload do relatório de produção em formato CSV
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="csv-file">Arquivo CSV</Label>
          <Input
            id="csv-file"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            disabled={importing}
          />
        </div>

        <Button
          onClick={handleImport}
          disabled={!file || importing}
          className="w-full"
        >
          <Upload className="mr-2 h-4 w-4" />
          {importing ? "Importando..." : "Importar Apólices"}
        </Button>

        {result && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">{result.success} apólices importadas</span>
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
      </CardContent>
    </Card>
  );
}
