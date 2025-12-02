-- Script para tornar usuário administrador
-- Execute este SQL no Supabase Dashboard SQL Editor
-- https://supabase.com/dashboard/project/kcdgdgcswrcbuvtcnmbw/sql

-- Tornar guilhermeleogo@gmail.com admin
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
WHERE u.email = 'guilhermeleogo@gmail.com';
