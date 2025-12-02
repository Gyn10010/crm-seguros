import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from './ui/button';
import { toast } from 'sonner';

/**
 * Migration Helper Component
 * Shows a button to apply the permissions migration if needed
 */
export function MigrationHelper() {
    const [needsMigration, setNeedsMigration] = useState<boolean | null>(null);
    const [isApplying, setIsApplying] = useState(false);

    useEffect(() => {
        checkMigrationStatus();
    }, []);

    const checkMigrationStatus = async () => {
        try {
            // Try to select the permissions column
            const { error } = await supabase
                .from('profiles')
                .select('permissions')
                .limit(1);

            // If no error, column exists
            setNeedsMigration(!!error);
        } catch (err) {
            console.error('Error checking migration status:', err);
        }
    };

    const applyMigration = async () => {
        setIsApplying(true);

        try {
            // Since we can't run ALTER TABLE with the public key,
            // we'll show instructions instead
            toast.error('Por favor, aplique a migration manualmente no Supabase Dashboard');

            // Copy SQL to clipboard
            const sql = "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '[]'::jsonb;";

            if (navigator.clipboard) {
                await navigator.clipboard.writeText(sql);
                toast.success('SQL copiado para a área de transferência!');
            }

            // Open Supabase dashboard in new tab
            window.open('https://app.supabase.com', '_blank');

        } catch (error) {
            console.error('Error:', error);
            toast.error('Erro ao processar migration');
        } finally {
            setIsApplying(false);
        }
    };

    if (needsMigration === null) {
        return null; // Loading
    }

    if (!needsMigration) {
        return null; // No migration needed
    }

    return (
        <div className="fixed bottom-4 right-4 bg-yellow-100 border-2 border-yellow-400 rounded-lg p-4 shadow-lg max-w-md">
            <h3 className="font-bold text-yellow-900 mb-2">⚠️ Migration Necessária</h3>
            <p className="text-sm text-yellow-800 mb-3">
                A tabela de perfis precisa ser atualizada para suportar permissões de usuário.
            </p>
            <Button
                onClick={applyMigration}
                disabled={isApplying}
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
            >
                {isApplying ? 'Processando...' : 'Copiar SQL e Abrir Supabase'}
            </Button>
            <p className="text-xs text-yellow-700 mt-2">
                Clique para copiar o SQL e abrir o Supabase Dashboard
            </p>
        </div>
    );
}
