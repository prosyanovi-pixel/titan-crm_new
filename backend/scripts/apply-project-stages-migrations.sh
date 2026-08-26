#!/bin/bash
# Script to apply project_stage reference table migrations
# Usage: ./apply-project-stages-migrations.sh

set -e

echo "🚀 Applying project_stage reference table migrations..."

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "❌ Error: psql is not installed or not in PATH"
    exit 1
fi

# Database connection parameters (can be overridden via environment variables)
# NOTE: PostgreSQL default port is 5432, NOT 5001 (backend server port)
# From backend/.env:
DB_HOST=${DB_HOST:-"localhost"}
DB_PORT=${DB_PORT:-"5432"}
DB_NAME=${DB_NAME:-"titancrm1"}
DB_USER=${DB_USER:-"myuser"}

echo "📊 Connecting to database: $DB_NAME@$DB_HOST:$DB_PORT as $DB_USER"

# Apply migration 202
echo "📝 Applying migration 202: Add color to project_stage..."
psql -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -U "$DB_USER" -f "../migrations/202_add_color_to_project_stage_reference.sql"

# Apply migration 203
echo "📝 Applying migration 203: Add variant to project_stage..."
psql -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -U "$DB_USER" -f "../migrations/203_add_variant_to_project_stage_reference.sql"

echo "✅ Migrations applied successfully!"
echo ""
echo "📋 Next steps:"
echo "   1. Restart your backend server"
echo "   2. Test creating/editing project stages with color and variant"
echo "   3. Verify stages appear correctly in ProjectBoard and ProjectList"
