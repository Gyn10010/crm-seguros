# Correção do Erro de Configuração de Campos de Clientes

## Problema Identificado

Quando o usuário tentava acessar "Configurar Campos" na tela de Clientes, apareciam dois erros:
1. **"Erro ao carregar configurações de campos"**
2. **"Erro ao atualizar configuração"**

## Causa Raiz

O problema tinha duas causas principais:

### 1. Obtenção Incorreta do User ID
O código estava tentando obter o `userId` do `localStorage` com a chave `'sb-session'`:

```tsx
const sessionStr = localStorage.getItem('sb-session');
if (sessionStr) {
    const session = JSON.parse(sessionStr);
    setCurrentUserId(session.user.id);
}
```

**Problema:** O Supabase não armazena a sessão com essa chave específica, e o formato pode variar.

### 2. Possível Ausência da Tabela no Banco de Dados
A tabela `client_field_config` pode não ter sido criada no banco de dados Supabase, apesar de existir a migração.

## Solução Implementada

### 1. Uso da API do Supabase para Autenticação
Alterado o código em `ClientList.tsx` para usar a API oficial do Supabase:

```tsx
const getCurrentUser = async () => {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        if (user) {
            setCurrentUserId(user.id);
        } else {
            console.warn('No authenticated user found');
        }
    } catch (error) {
        console.error('Error getting current user:', error);
    }
};
```

**Benefícios:**
- ✅ Usa a API oficial do Supabase
- ✅ Obtém o usuário autenticado corretamente
- ✅ Melhor tratamento de erros
- ✅ Não depende de implementação interna do localStorage

### 2. Melhor Tratamento de Erros
Adicionado logging detalhado em `ClientFieldsConfig.tsx`:

```tsx
const loadFieldConfigs = async () => {
    try {
        console.log('Loading field configs for user:', userId);
        
        const { data, error } = await supabase
            .from('client_field_config')
            .select('*')
            .eq('user_id', userId);

        if (error) {
            console.error('Supabase error:', error);
            throw error;
        }

        console.log('Field configs loaded:', data);
        // ... resto do código
    } catch (error: any) {
        console.error('Error loading field configs:', error);
        toast({
            title: 'Erro',
            description: `Erro ao carregar configurações de campos: ${error.message || 'Erro desconhecido'}`,
            variant: 'destructive',
        });
    }
};
```

**Benefícios:**
- ✅ Mensagens de erro mais descritivas
- ✅ Logging no console para debug
- ✅ Feedback claro para o usuário

## Verificação da Tabela no Supabase

A tabela `client_field_config` deve existir com a seguinte estrutura:

```sql
CREATE TABLE IF NOT EXISTS public.client_field_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  field_name TEXT NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, field_name)
);
```

### Como Verificar se a Tabela Existe

1. Acesse o painel do Supabase: https://kcdgdgcswrcbuvtcnmbw.supabase.co
2. Vá em **Table Editor**
3. Procure pela tabela `client_field_config`

### Se a Tabela Não Existir

Execute a migração manualmente no **SQL Editor** do Supabase:

1. Acesse **SQL Editor** no painel do Supabase
2. Cole o conteúdo do arquivo: `supabase/migrations/20251009184606_a59f85b7-79f9-4eba-9b4d-ed736c5a0519.sql`
3. Execute o SQL

## Como Testar

1. Faça login no CRM
2. Vá para a página de **Clientes**
3. Clique em **"Configurar Campos"**
4. Abra o Console do navegador (F12)
5. Verifique os logs:
   - Deve aparecer: `Loading field configs for user: [seu-user-id]`
   - Deve aparecer: `Field configs loaded: [array de configs]`
6. Tente alternar um dos switches
7. Verifique se aparece: `Updating field config: { userId, fieldName, isRequired }`

## Próximos Passos

Se o erro persistir após essas correções, verifique:

1. **Console do navegador** - Procure por mensagens de erro detalhadas
2. **Permissões RLS** - Verifique se as políticas de Row Level Security estão corretas
3. **Autenticação** - Confirme que o usuário está autenticado corretamente

## Arquivos Modificados

- ✅ `src/components/ClientList.tsx` - Corrigida obtenção do userId
- ✅ `src/components/ClientFieldsConfig.tsx` - Melhorado tratamento de erros e logging
