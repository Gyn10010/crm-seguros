@echo off
echo Criando link publico para o LDR Seguros CRM...
echo.
echo IMPORTANTE: O sistema (iniciar_sistema.bat) ja deve estar rodando!
echo.
echo ========================================================
echo   SENHA DO TUNNEL (Copie o IP abaixo se pedir senha)
echo ========================================================
curl -s https://loca.lt/mytunnelpassword
echo.
echo ========================================================
echo.
echo Aguarde, gerando link...
echo.
call lt --port 8080
pause
