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
- **Status:** ✅ Populated. JSON fields: `{username, password, host, port, dbname, engine}`. Retrieve with `aws secretsmanager get-secret-value --region ap-south-1 --secret-id aiagency-prod-rds-credentials --query SecretString --output text`.

## DATABASE_URL Format

```
postgresql+asyncpg://aiagency_admin:<password>@aiagency-prod-postgres.cqtc8twm2l5o.ap-south-1.rds.amazonaws.com:5432/aiagency
```

Password must be URL-encoded. Retrieve from Secrets Manager:
```bash
aws secretsmanager get-secret-value \
  --region ap-south-1 \
  --secret-id aiagency-prod-rds-credentials \
  --query SecretString --output text \
  | python3 -c "import sys,json,urllib.parse as u; d=json.loads(sys.stdin.read()); print(f\"postgresql+asyncpg://{d['username']}:{u.quote_plus(d['password'])}@{d['host']}:{d['port']}/{d['dbname']}\")"
```

## Migration Status

- Alembic baseline migration `f3d8509b1541` applied successfully
- Tables: `brands`, `generation_jobs`, `content_pieces`, `alembic_version`

## Follow-ups

- [x] ~~Grant the instance role `secretsmanager:*` permissions and re-run `terraform apply` to populate the secret~~ — Done 2026-04-25
- [ ] Enable Multi-AZ when production load justifies cost
- [ ] Add custom parameter group with `pg_stat_statements`
- [ ] Consider pgvector for embedding storage
- [ ] Migrate terraform state to S3 backend
