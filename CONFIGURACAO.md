# Guia de Configuração - LDR Seguros CRM

## ⚙️ Configuração Inicial

### 1. Chave da API do Google Gemini

O sistema utiliza a API do Google Gemini para o Assistente IA. Para configurá-la:

#### Obter a chave da API:
1. Acesse [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Faça login com sua conta Google
3. Clique em "Create API Key"
4. Copie a chave gerada

#### Configurar no projeto:
1. Crie um arquivo `.env` na raiz do projeto (copie de `.env.example`)
2. Adicione sua chave:
```
VITE_GEMINI_API_KEY=sua_chave_aqui
```

### 2. Primeiro Acesso

Use as credenciais padrão para fazer login:
- **Email:** demo@ldrseguros.com
- **Senha:** 123456

### 3. Personalização

#### Alterar Tema
1. Faça login como Gestor
2. Acesse "Configurações"
3. Na seção "Geral", altere a cor do tema

#### Gerenciar Usuários
1. Acesse "Configurações" → "Usuários"
2. Adicione novos usuários ou edite existentes
3. Defina permissões por página

#### Tipos de Apólice
1. Acesse "Configurações" → "Tipos de Apólice"
2. Adicione os tipos específicos da sua corretora
3. Exemplo: Auto, Residencial, Empresarial, Vida, etc.

## 🔧 Recursos Principais

### Dashboard
- Visualização geral de métricas importantes
- Gráficos de apólices por tipo
- Status de oportunidades
- Alertas de renovação próxima

### Gestão de Clientes
- Cadastro completo com dados de contato
- Histórico de apólices
- Busca e filtros avançados

### Apólices
- Controle de todas as apólices
- Cálculo automático de comissões
- Vincular com clientes e seguradoras
- Monitorar status e vencimentos

### Seguradoras
- Cadastro de parceiros
- Armazenar credenciais de acesso (criptografadas)
- Links diretos para portais
- Contatos importantes

### Renovações
- Acompanhar todas as renovações pendentes
- Atribuir responsáveis
- Registrar negociações
- Histórico de contatos

### Tarefas (Kanban)
- Organização visual de tarefas
- Drag & drop
- Vincular com clientes e oportunidades
- Tarefas recorrentes

### Funil de Vendas
- Múltiplos funis (Novos Negócios, Pós-Venda, Endosso, Sinistro)
- Acompanhar progresso de oportunidades
- Atividades por estágio
- Previsão de comissões

### Assistente IA
- Chat inteligente com IA
- Análise de carteira
- Sugestões de cross-selling
- Identificação de oportunidades

## 🎨 Customização Visual

O sistema permite personalizar:
- Cor principal (marca)
- Nome da empresa
- Moeda padrão
- Dias de alerta para renovação

Todas as configurações ficam em **Configurações → Geral**

## 📊 Dados Iniciais

O sistema vem com dados de demonstração:
- 2 clientes
- 3 apólices
- 2 tarefas
- Oportunidades de exemplo

Para começar com dados reais:
1. Remova os dados de demonstração
2. Cadastre seus clientes reais
3. Adicione as apólices existentes
4. Configure as seguradoras parceiras

## 🔐 Segurança

- Senhas de credenciais são armazenadas de forma segura
- Usuários têm permissões específicas
- Apenas Gestores acessam Configurações
- Login obrigatório para acessar o sistema

## 💡 Dicas de Uso

1. **Mantenha o Dashboard atualizado**: Revise diariamente as renovações próximas
2. **Use o Assistente IA**: Peça sugestões de cross-selling e análises
3. **Organize Tarefas**: Crie tarefas para não esquecer follow-ups
4. **Funil de Vendas**: Mantenha as oportunidades atualizadas
5. **Renovações**: Atribua responsáveis e acompanhe o status

## 🆘 Solução de Problemas

### Assistente IA não responde
- Verifique se a chave da API está configurada corretamente no `.env`
- Reinicie o servidor de desenvolvimento

### Gráficos não aparecem
- Certifique-se de que há dados cadastrados
- Recarregue a página

### Não consigo fazer login
- Use as credenciais padrão: demo@ldrseguros.com / 123456
- Limpe o cache do navegador

## 📞 Suporte

Para suporte técnico ou dúvidas:
- Email: suporte@ldrseguros.com
- Consulte a documentação no README.md
