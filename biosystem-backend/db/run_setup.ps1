# Script PowerShell para executar o setup de procedimentos no PostgreSQL
# Use no PowerShell do Windows

# Configurar variáveis de banco de dados
$DB_HOST = "localhost"
$DB_PORT = "5432"
$DB_NAME = "biosystem"
$DB_USER = "postgres"
$SCRIPT_PATH = Join-Path $PSScriptRoot "setup_procedimentos_completo.sql"

Write-Host "🔧 Executando setup de procedimentos no PostgreSQL..." -ForegroundColor Green
Write-Host "Host: $DB_HOST" -ForegroundColor Cyan
Write-Host "Porta: $DB_PORT" -ForegroundColor Cyan
Write-Host "Banco: $DB_NAME" -ForegroundColor Cyan
Write-Host "Usuário: $DB_USER" -ForegroundColor Cyan
Write-Host ""

# Verificar se o arquivo existe
if (-not (Test-Path $SCRIPT_PATH)) {
    Write-Host "❌ Arquivo não encontrado: $SCRIPT_PATH" -ForegroundColor Red
    exit 1
}

# Tentar executar com psql
try {
    $env:PGPASSWORD = Read-Host "Digite a senha do PostgreSQL"
    
    & psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f $SCRIPT_PATH
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Setup concluído com sucesso!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Próximos passos:" -ForegroundColor Green
        Write-Host "1. Reinicie o backend: npm start" -ForegroundColor Yellow
        Write-Host "2. Faça login no aplicativo" -ForegroundColor Yellow
        Write-Host "3. Acesse a aba 'Procedimentos'" -ForegroundColor Yellow
    } else {
        Write-Host ""
        Write-Host "❌ Erro ao executar setup" -ForegroundColor Red
        Write-Host "Código de erro: $LASTEXITCODE" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Erro: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Dicas:" -ForegroundColor Yellow
    Write-Host "- Verifique se PostgreSQL está instalado e rodando" -ForegroundColor Yellow
    Write-Host "- Verifique se 'psql' está no PATH" -ForegroundColor Yellow
    Write-Host "- Verifique as credenciais de banco de dados" -ForegroundColor Yellow
}

# Limpar variável de senha
$env:PGPASSWORD = ""
