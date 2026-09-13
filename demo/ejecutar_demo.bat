@echo off
REM =========================================================================
REM ObraClara AI — Script de Demo para Hackathon (Windows)
REM =========================================================================

echo.
echo   ======================================================
echo     ObraClara AI — Demo de Hackathon
echo   ======================================================
echo.

REM --- Verificar .env ---
if not exist ".env" (
    echo   [!] Archivo .env no encontrado.
    echo   Copia .env.example a .env y configura tus claves.
    pause
    exit /b 1
)

REM --- Verificar node_modules ---
if not exist "node_modules" (
    echo   Instalando dependencias...
    call npm install
    echo.
)

REM --- Generar PDFs de demo ---
if not exist "demo\contrato_original.pdf" (
    echo   Generando PDFs de demo...
    node demo\generar_pdfs.js
    echo.
)

echo   Levantando servicios...
echo.
echo   Backend:   http://localhost:3001
echo   Frontend:  http://localhost:5173
echo.
echo   PASOS DE LA DEMO:
echo   1. Abre http://localhost:5173
echo   2. Conecta MetaMask (red HSK Testnet)
echo   3. Sube demo\contrato_original.pdf
echo   4. Mis Obras - Verificar con demo\contrato_modificado.pdf
echo   5. Observa: CONGELADA + reporte IA
echo   6. Ve al detalle - Rechazar cambio
echo   7. Muestra el historial de versiones
echo.

REM Levantar backend
start "ObraClara Backend" cmd /c "node backend\src\index.js"
timeout /t 2 /nobreak > nul

REM Levantar frontend
start "ObraClara Frontend" cmd /c "npx --no-install vite frontend\ --host"

echo   Demo iniciada. Cierra las ventanas para detener.
pause
