/**
 * Verificar se usuário é admin
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kcdgdgcswrcbuvtcnmbw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjZGdkZ2Nzd3JjYnV2dGNubWJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2Nzg4MDUsImV4cCI6MjA4MDI1NDgwNX0.SviNuiTZhEyTlb8SbWjzaEwAY8KTBVviTlHsJp_KCYQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkAdminStatus() {
    console.log('🔍 Verificando status de admin...\n');

    // Primeiro, precisamos ver se o usuário existe
    const email = 'guilhermeleogo@gmail.com';

    console.log(`📧 Procurando usuário: ${email}\n`);

    // Como não temos acesso direto à tabela auth.users com anon key,
    // vamos verificar a tabela user_roles diretamente

    const { data: roles, error } = await supabase
        .from('user_roles')
        .select('*');

    if (error) {
        console.log('❌ Erro ao buscar roles:', error);
        console.log('\n⚠️  Isso pode significar que você não está logado na aplicação.');
        console.log('Ou que não tem permissão para visualizar user_roles.');
        return;
    }

    console.log('📊 Todos os registros em user_roles:');
    console.table(roles);

    if (!roles || roles.length === 0) {
        console.log('\n⚠️  Nenhum usuário tem role definida ainda!');
        console.log('\n💡 Solução:');
        console.log('Execute este SQL no Supabase Dashboard:');
        console.log(`
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'::app_role 
FROM auth.users 
WHERE email = '${email}'
ON CONFLICT (user_id, role) DO NOTHING;
    `);
        return;
    }

    const adminUsers = roles.filter(r => r.role === 'admin');
    console.log(`\n✅ ${adminUsers.length} administrador(es) encontrado(s)`);

    if (adminUsers.length === 0) {
        console.log('\n⚠️  Nenhum admin encontrado! Execute o SQL para tornar-se admin.');
    }
}

checkAdminStatus();
