/**
 * Script para copiar o SQL e abrir o Supabase Dashboard
 * Run with: npx tsx scripts/make-user-admin.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';

const sqlContent = `-- Tornar guilhermeleogo@gmail.com admin
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'::app_role 
FROM auth.users 
WHERE email = 'guilhermeleogo@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Verificar se foi criado com sucesso
SELECT 
  u.email,
  ur.role
FROM auth.users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
WHERE u.email = 'guilhermeleogo@gmail.com';`;

console.log('🔐 Script para tornar usuário ADMIN\n');
console.log('📋 SQL a ser executado:');
console.log('─'.repeat(60));
console.log(sqlContent);
console.log('─'.repeat(60));

console.log('\n📝 O SQL foi salvo em: scripts/make-user-admin.sql');
console.log('\n🚀 Próximos passos:');
console.log('1. Copie o SQL acima (ou abra o arquivo make-user-admin.sql)');
console.log('2. Vá para: https://supabase.com/dashboard/project/kcdgdgcswrcbuvtcnmbw/sql');
console.log('3. Cole o SQL no editor');
console.log('4. Clique em RUN');
console.log('5. Faça logout e login novamente na aplicação\n');

// Tentar copiar para clipboard (Windows)
if (process.platform === 'win32') {
    try {
        exec(`echo ${sqlContent.replace(/\n/g, ' & echo ')} | clip`, (error) => {
            if (!error) {
                console.log('✅ SQL copiado para a área de transferência!\n');
            }
        });
    } catch (err) {
        console.log('⚠️  Não foi possível copiar automaticamente. Copie manualmente.\n');
    }
}

// Tentar abrir o browser
const url = 'https://supabase.com/dashboard/project/kcdgdgcswrcbuvtcnmbw/sql';
const start = process.platform === 'darwin' ? 'open' :
    process.platform === 'win32' ? 'start' : 'xdg-open';

exec(`${start} ${url}`, (error) => {
    if (!error) {
        console.log('🌐 Abrindo Supabase Dashboard...\n');
    }
});
