# Como rodar o projeto localmente

O projeto foi configurado para rodar com um backend local (Node.js + SQLite), eliminando a necessidade do Supabase e Docker.

## Pré-requisitos
- Node.js instalado.

## Passos para rodar

### 1. Iniciar o Backend
Abra um terminal na pasta `backend` e execute:

```bash
cd backend
npm install  # Apenas na primeira vez
node server.js
```

O servidor estará rodando em `http://localhost:3000`.

### 2. Iniciar o Frontend
Abra um **novo terminal** na raiz do projeto e execute:

```bash
npm run dev
```

O frontend estará acessível em `http://localhost:8080` (ou outra porta indicada).

## Credenciais de Acesso
Use as seguintes credenciais para fazer login:
- **Email:** `demo@ldrseguros.com`
- **Senha:** `123456`

## Notas Importantes
- O banco de dados é um arquivo local `backend/crm.db`.
- Se você reiniciar o computador, precisará iniciar o backend novamente.
- Todas as funcionalidades principais (Clientes, Apólices, Tarefas) agora salvam neste banco de dados local.

## 🚀 Inicialização Automática (Opcional)

Para facilitar, criei um arquivo chamado `iniciar_sistema.bat` na pasta do projeto. Basta clicar duas vezes nele para abrir tudo de uma vez.

### Para iniciar junto com o Windows:
1.  Clique com o botão direito no arquivo `iniciar_sistema.bat` e escolha **Criar Atalho**.
2.  Pressione `Windows + R` no teclado.
3.  Digite `shell:startup` e dê Enter.
4.  Mova o atalho que você criou para dentro dessa pasta que abriu.

Pronto! Agora sempre que ligar o computador, o sistema abrirá automaticamente.

## 🌐 Acesso por Outras Pessoas (Rede Local)

Para que outras pessoas na mesma rede Wi-Fi/Cabo acessem o sistema:

1.  Descubra o **Endereço IPv4** do seu computador:
    - Abra o terminal e digite `ipconfig`.
    - Procure por "Adaptador Ethernet" ou "Wi-Fi".
    - Copie o número ao lado de **Endereço IPv4** (ex: `192.168.1.15`).

2.  Nos outros computadores/celulares, acesse pelo navegador:
    - `http://SEU_IP_AQUI:8080`
    - Exemplo: `http://192.168.1.15:8080`

**Importante:**
- O seu computador precisa estar ligado e com o sistema rodando.
- Se não funcionar, verifique se o **Firewall do Windows** não está bloqueando o Node.js (portas 3000 e 8080).

## 🌍 Acesso Público (Internet)

Se você quiser que alguém acesse de **fora da sua rede** (ex: de casa, do 4G, de outra cidade), sem precisar de VPN:

1.  Certifique-se que o sistema está rodando (passo inicial).
2.  Clique duas vezes no arquivo `acesso_publico.bat` que criei na pasta.
3.  Uma janela preta abrirá e mostrará um link (ex: `https://breezy-donkey-45.loca.lt`).
4.  Envie esse link para a pessoa.

**Atenção:**
- Esse link muda toda vez que você fecha a janela.
- A janela do `acesso_publico.bat` precisa ficar aberta para o link funcionar.
- **Se pedir uma senha:** O site pode pedir um "Tunnel Password". O número da senha aparecerá na janela preta do `acesso_publico.bat` (logo acima do link). É só copiar e colar.
