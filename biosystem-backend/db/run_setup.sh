#!/bin/bash
# Script para executar o setup de procedimentos no PostgreSQL
# Use este arquivo no terminal (Mac/Linux) ou PowerShell

# Configurar variáveis de banco de dados
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="biosystem"
DB_USER="postgres"

echo "🔧 Executando setup de procedimentos no PostgreSQL..."
echo "Host: $DB_HOST"
echo "Porta: $DB_PORT"
echo "Banco: $DB_NAME"
echo "Usuário: $DB_USER"
echo ""

# Executar o script SQL
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$(dirname "$0")/setup_procedimentos_completo.sql"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Setup concluído com sucesso!"
else
    echo ""
    echo "❌ Erro ao executar setup"
    echo "Verifique se:"
    echo "  1. PostgreSQL está rodando"
    echo "  2. As credenciais estão corretas"
    echo "  3. O banco de dados 'biosystem' existe"
fi
