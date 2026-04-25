# RDS Deployment Outputs

## Endpoint

```
aiagency-prod-postgres.cqtc8twm2l5o.ap-south-1.rds.amazonaws.com:5432
```

## Database

- **Name:** aiagency
- **Engine:** PostgreSQL 16.13
- **Instance:** db.t4g.micro, gp3, 20 GB, encrypted
- **Region:** ap-south-1c

## Security Group

- **ID:** sg-0bcadac7242314f7c
- **VPC CIDR ingress:** 172.31.0.0/16 (default VPC internal traffic)
- **Publicly accessible:** No

## Secrets Manager

- **ARN:** arn:aws:secretsmanager:ap-south-1:474132537731:secret:aiagency-prod-rds-credentials-z5fPtR
- **Status:** Secret created but value not yet populated (the instance role lacks `secretsmanager:PutSecretValue` permission). Credentials are in `terraform.tfstate` (local, never committed). A user with sufficient IAM permissions should run `terraform apply` to populate the secret, or manually store the credentials via the AWS console.

## DATABASE_URL Format

```
postgresql+asyncpg://aiagency_admin:<password>@aiagency-prod-postgres.cqtc8twm2l5o.ap-south-1.rds.amazonaws.com:5432/aiagency
```

Password must be URL-encoded. Retrieve from terraform state:
```bash
cd infra/terraform/rds
terraform show -json | python3 -c "
import sys, json, urllib.parse
state = json.load(sys.stdin)
for r in state['values']['root_module']['resources']:
    if r['address'] == 'random_password.master':
        print(urllib.parse.quote_plus(r['values']['result']))
"
```

## Migration Status

- Alembic baseline migration `f3d8509b1541` applied successfully
- Tables: `brands`, `generation_jobs`, `content_pieces`, `alembic_version`

## Follow-ups

- [ ] Grant the instance role `secretsmanager:*` permissions and re-run `terraform apply` to populate the secret
- [ ] Enable Multi-AZ when production load justifies cost
- [ ] Add custom parameter group with `pg_stat_statements`
- [ ] Consider pgvector for embedding storage
- [ ] Migrate terraform state to S3 backend
