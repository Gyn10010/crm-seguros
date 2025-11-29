@echo off
echo Iniciando LDR Seguros CRM...

:: Iniciar Backend
echo Iniciando Servidor Backend...
start "LDR Backend" /min cmd /k "cd backend && node server.js"

:: Aguardar 2 segundos para o backend subir
timeout /t 2 /nobreak >nul

:: Iniciar Frontend
echo Iniciando Frontend...
start "LDR Frontend" /min cmd /k "npm run dev"

echo.
echo Sistema iniciado com sucesso!
echo O Backend esta rodando na porta 3000.
echo O Frontend esta rodando na porta 8080.
echo.
echo Voce pode minimizar esta janela ou fecha-la.
echo Para parar o sistema, feche as janelas do "LDR Backend" e "LDR Frontend".
timeout /t 5
