# Database Setup

## Local Development

### Option A: SQLite (default, zero config)

No setup needed. The app defaults to `sqlite+aiosqlite:///./content_engine.db`.

### Option B: Docker PostgreSQL

```bash
# From repo root
docker compose up -d postgres

# Set in AI_Agency/.env
DATABASE_URL=postgresql+asyncpg://aiagency:localdev123@localhost:5432/aiagency
```

### Running Migrations

```bash
cd AI_Agency
DATABASE_URL="..." alembic upgrade head
```

To generate a new migration after model changes:

```bash
cd AI_Agency
DATABASE_URL="..." alembic revision --autogenerate -m "describe the change"
```

## Deployment

For the full ECS Fargate deployment guide (build, push, deploy, logs, shell access), see [DEPLOYMENT.md](./DEPLOYMENT.md).

## Production (AWS RDS)

The production PostgreSQL instance runs on AWS RDS in ap-south-1.

Credentials are stored in AWS Secrets Manager. To construct `DATABASE_URL`:

```bash
SECRET=$(aws secretsmanager get-secret-value \
  --secret-id aiagency-prod-rds-credentials \
  --query SecretString --output text)

# Parse JSON and build the URL
USER=$(echo $SECRET | python3 -c "import sys,json; print(json.load(sys.stdin)['username'])")
PASS=$(echo $SECRET | python3 -c "import sys,json; import urllib.parse; print(urllib.parse.quote_plus(json.load(sys.stdin)['password']))")
HOST=$(echo $SECRET | python3 -c "import sys,json; print(json.load(sys.stdin)['host'])")

export DATABASE_URL="postgresql+asyncpg://${USER}:${PASS}@${HOST}:5432/aiagency"
```

### PgBouncer

If connecting through PgBouncer (e.g., Supabase pooler), set `PGBOUNCER=true` as an environment variable. This disables SQLAlchemy's connection pool and prepared statements for compatibility.
