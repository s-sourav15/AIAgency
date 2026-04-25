# RDS PostgreSQL — AIAgency

Terraform module that provisions a PostgreSQL 16 instance on AWS RDS in `ap-south-1`.

## Resources Created

- **RDS Instance** (`db.t4g.micro`, gp3, 20 GB, encrypted)
- **DB Subnet Group** across default VPC subnets
- **Security Group** with configurable ingress CIDRs for port 5432
- **Secrets Manager Secret** storing `{username, password, host, port, dbname, engine}`
- **Random Password** (32 chars) for the master user

## Usage

```bash
cd infra/terraform/rds

# Initialize
terraform init

# Preview changes
terraform plan -out=tfplan

# Apply (RDS creation takes ~8-12 minutes)
terraform apply tfplan
```

### Reading Credentials

```bash
aws secretsmanager get-secret-value \
  --secret-id aiagency-prod-rds-credentials \
  --query SecretString --output text | python3 -c "
import sys, json, urllib.parse
s = json.load(sys.stdin)
p = urllib.parse.quote_plus(s['password'])
print(f\"postgresql+asyncpg://{s['username']}:{p}@{s['host']}:{s['port']}/{s['dbname']}\")
"
```

### Setting DATABASE_URL

```bash
export DATABASE_URL="postgresql+asyncpg://<user>:<urlencoded-pass>@<host>:5432/aiagency"
```

## Variables

| Name | Default | Description |
|------|---------|-------------|
| `project_name` | `aiagency` | Resource naming prefix |
| `env` | `prod` | Environment label |
| `allowed_cidrs` | `[]` | CIDRs allowed to reach port 5432 |
| `instance_class` | `db.t4g.micro` | RDS instance size |
| `allocated_storage` | `20` | Storage in GB |

## Outputs

| Name | Description |
|------|-------------|
| `db_endpoint` | RDS endpoint (host:port) |
| `db_port` | Port number |
| `db_name` | Database name |
| `secret_arn` | Secrets Manager ARN |
| `security_group_id` | RDS security group ID |

## Follow-ups

- Enable Multi-AZ when revenue justifies it
- Add custom parameter group with `pg_stat_statements`
- Consider pgvector extension for embedding storage
- Migrate to S3 backend for terraform state
