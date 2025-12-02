/**
 * Script para verificar se a coluna permissions existe
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kcdgdgcswrcbuvtcnmbw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjZGdkZ2Nzd3JjYnV2dGNubWJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2Nzg4MDUsImV4cCI6MjA4MDI1NDgwNX0.SviNuiTZhEyTlb8SbWjzaEwAY8KTBVviTlHsJp_KCYQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkPermissionsColumn() {
    console.log('🔍 Verificando coluna permissions...\n');

    try {
        // Tenta selecionar a coluna permissions
        const { data, error } = await supabase
            .from('profiles')
            .select('permissions')
            .limit(1);

        if (error) {
            console.log('❌ Coluna permissions NÃO existe!');
            console.log('Erro:', error.message);
            console.log('\n📋 Execute este SQL no Supabase Dashboard:');
            console.log("ALTER TABLE profiles ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '[]'::jsonb;\n");
            return false;
        }

        console.log('✅ Coluna permissions EXISTE!');
        console.log('Resultado da query:', data);
        console.log('\nA coluna está OK. Se ainda vê a caixa amarela, tente:');
        console.log('1. Fazer hard refresh (Ctrl+Shift+R)');
        console.log('2. Limpar cache do navegador');
        return true;
    } catch (err) {
        console.error('Erro ao verificar:', err);
        return false;
    }
}

checkPermissionsColumn();
