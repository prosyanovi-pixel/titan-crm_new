# TITAN CRM

TITAN CRM — monorepo for internal CRM used by the project.

This repository contains backend and frontend code, migrations, and documentation.

## Installation

### Quick Start (All Platforms)

**Windows (PowerShell):**
```powershell
.\init.ps1
```

**Windows (CMD):**
```cmd
init.bat
```

**Linux / macOS:**
```bash
./init.sh
```

These scripts will:
- Check for Node.js and npm
- Install dependencies in root, backend, and frontend directories
- Provide helpful error messages if something fails

### Manual Installation

This is a monorepo with workspaces. Install all dependencies from the root:

```bash
npm install
```

The project uses `legacy-peer-deps` mode (configured in `.npmrc`) to resolve peer dependency conflicts between packages.

## DB prerequisites

Before running `npm run migrate` ensure the PostgreSQL server meets these prerequisites:

- PostgreSQL server (recommended >= 13). The migration runner is OS-agnostic (runs via Node), but extensions are provided by the database server.
- One of the following extensions must be available on the database:
  1. `pgcrypto` (preferred) — provides `gen_random_uuid()` used by several migrations.
  2. `uuid-ossp` — if `pgcrypto` is not available, the migrate script will attempt to enable `uuid-ossp` and create a lightweight wrapper `gen_random_uuid()` using `uuid_generate_v4()`.

How to enable extensions (requires a DB superuser or privileges to create extensions):

1. Connect to the database using `psql` or another SQL client as a privileged user.

```sql
-- check existing extensions
\dx

-- enable pgcrypto (preferred)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- or, if pgcrypto unavailable, enable uuid-ossp
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

2. If you cannot create extensions in your managed DB (RDS, Azure, etc.), consult your provider docs or enable the extension via the provider console / request support.

Notes:
- The migration runner attempts to create `pgcrypto` automatically. If that fails, it tries `uuid-ossp` and will create a wrapper function `gen_random_uuid()` so existing migrations still work.
- If neither extension can be enabled automatically (permission or provider restrictions), `npm run migrate` will exit with instructions and non-zero exit code.

## Quick start (backend)

```bash
cd backend
cp env.example env    # edit DB_* and other variables in backend/env
npm install
npm run migrate
npm run dev
```

If `npm run migrate` fails with a permission error when creating an extension, run the `CREATE EXTENSION` command (shown above) as a superuser or ask your DBA to enable it.

## Where to look for more docs
- Backend docs: `docs/backend/README.md`
- Migrations: `backend/migrations/README.md`
- Contributing: see `docs/` folder
