@echo off
REM Script de Deploy Biosystem para Vercel
REM Execute este arquivo para facilitar o deploy

setlocal enabledelayedexpansion

echo.
echo ======================================
echo   BIOSYSTEM - VERCEL DEPLOY SCRIPT
echo ======================================
echo.

REM Verificar se Node.js está instalado
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Node.js nao encontrado. Instale em: https://nodejs.org/
    exit /b 1
)

echo [OK] Node.js detectado
node --version
echo.

REM Menu de opções
echo Escolha uma opcao:
echo 1) Build local (verificar erros)
echo 2) Build production (sem sourcemaps)
echo 3) Instalar Vercel CLI
echo 4) Deploy (requer Vercel CLI)
echo 5) Sair
echo.

set /p choice="Digite sua opcao (1-5): "

if "%choice%"=="1" (
    echo.
    echo [BUILD] Compilando projeto...
    call npm run build
    if errorlevel 1 (
        echo [ERRO] Build falhou!
        exit /b 1
    )
    echo [OK] Build completo! Verifique pasta /build
    
) else if "%choice%"=="2" (
    echo.
    echo [BUILD PROD] Compilando para producao (sem sourcemaps)...
    call npm run build:prod
    if errorlevel 1 (
        echo [ERRO] Build falhou!
        exit /b 1
    )
    echo [OK] Build production completo!
    
) else if "%choice%"=="3" (
    echo.
    echo [INSTALL] Instalando Vercel CLI...
    call npm install -g vercel
    if errorlevel 1 (
        echo [ERRO] Instalacao falhou!
        exit /b 1
    )
    echo [OK] Vercel CLI instalado!
    echo Proxima etapa: Execute este script novamente e escolha opcao 4
    
) else if "%choice%"=="4" (
    echo.
    REM Verificar se Vercel CLI está instalado
    vercel --version >nul 2>&1
    if errorlevel 1 (
        echo [ERRO] Vercel CLI nao encontrado.
        echo Execute este script e escolha opcao 3 para instalar primeiro.
        exit /b 1
    )
    
    echo [VERCEL] Iniciando deploy...
    echo.
    echo Opcoes:
    echo 1) Deploy normal (staging)
    echo 2) Deploy producao (--prod)
    echo 3) Cancelar
    echo.
    set /p deploy_choice="Digite sua opcao: "
    
    if "!deploy_choice!"=="1" (
        echo.
        echo [DEPLOY] Enviando para staging...
        call vercel
    ) else if "!deploy_choice!"=="2" (
        echo.
        echo [DEPLOY PROD] Enviando para producao...
        call vercel --prod
    ) else (
        echo [CANCELADO]
    )
    
) else if "%choice%"=="5" (
    echo [SAIDA] Encerrando...
    exit /b 0
    
) else (
    echo [ERRO] Opcao invalida!
    exit /b 1
)

echo.
echo ======================================
echo   Operacao concluida!
echo ======================================
echo.
pause
