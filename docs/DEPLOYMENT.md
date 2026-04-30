# Deployment Guide

The FastAPI backend runs on AWS ECS Fargate in `ap-south-1` (Mumbai).

## Architecture

```
GitHub Actions (build) → ECR → ECS Fargate → ALB → Internet
                                    ↓
                              RDS PostgreSQL
```

## Infrastructure

All infrastructure is managed via Terraform in `infra/terraform/ecs/`.

See [infra/terraform/ecs/README.md](../infra/terraform/ecs/README.md) for step-by-step provisioning instructions.

## Deploy Flow

### Automated (GitHub Actions)

1. Go to **Actions** → **Deploy Backend to ECS** → **Run workflow**
2. The workflow builds the Docker image, pushes to ECR, and triggers a rolling deployment.

### Manual

```bash
# From repo root
ECR_URL=474132537731.dkr.ecr.ap-south-1.amazonaws.com/aiagency-prod-backend

# Login
aws ecr get-login-password --region ap-south-1 | \
  docker login --username AWS --password-stdin 474132537731.dkr.ecr.ap-south-1.amazonaws.com

# Build & push
docker build --platform linux/amd64 -t $ECR_URL:$(git rev-parse --short HEAD) -t $ECR_URL:latest .
docker push $ECR_URL:$(git rev-parse --short HEAD)
docker push $ECR_URL:latest

# Deploy
aws ecs update-service \
  --cluster aiagency-prod \
  --service aiagency-prod-backend \
  --force-new-deployment \
  --region ap-south-1
```

## Monitoring

### Logs

```bash
# Stream logs
aws logs tail /ecs/aiagency-prod-backend --follow --region ap-south-1

# Search logs
aws logs filter-log-events \
  --log-group-name /ecs/aiagency-prod-backend \
  --filter-pattern "ERROR" \
  --region ap-south-1
```

### Health Checks

```bash
# Liveness (no DB call)
curl http://<ALB_DNS>/health

# Readiness (verifies DB connectivity)
curl http://<ALB_DNS>/ready
```

## ECS Exec (Shell Access)

ECS Exec is enabled on the service. To connect:

```bash
# Find running task
TASK_ID=$(aws ecs list-tasks --cluster aiagency-prod --service-name aiagency-prod-backend \
  --query 'taskArns[0]' --output text --region ap-south-1 | awk -F/ '{print $NF}')

# Connect
aws ecs execute-command \
  --cluster aiagency-prod \
  --task $TASK_ID \
  --container backend \
  --interactive \
  --command "/bin/bash" \
  --region ap-south-1
```

Requires the [Session Manager plugin](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-working-with-install-plugin.html).

## Environment Variables

| Variable | Source | Description |
|----------|--------|-------------|
| `DB_USER` | Secrets Manager (RDS) | Database username |
| `DB_PASSWORD` | Secrets Manager (RDS) | Database password |
| `DB_HOST` | Secrets Manager (RDS) | RDS endpoint |
| `DB_PORT` | Secrets Manager (RDS) | Database port |
| `DB_NAME` | Secrets Manager (RDS) | Database name |
| `ANTHROPIC_API_KEY` | Secrets Manager | Claude API key |
| `REPLICATE_API_TOKEN` | Secrets Manager | Replicate API token |
| `OPENAI_API_KEY` | Secrets Manager | OpenAI API key |
| `ALLOWED_ORIGINS` | Task definition | CORS origins |
| `ENV` | Task definition | Environment name |

## Runbook

### Service won't stabilize

1. Check CloudWatch logs for crash loops
2. Verify the image exists in ECR: `aws ecr describe-images --repository-name aiagency-prod-backend --region ap-south-1`
3. Check security group allows ALB → ECS on port 8000
4. Verify RDS security group allows ECS → RDS on port 5432

### Database connection failures

1. Confirm RDS is running: `aws rds describe-db-instances --db-instance-identifier aiagency-prod-postgres --region ap-south-1`
2. Verify secret exists: `aws secretsmanager get-secret-value --secret-id aiagency-prod-rds-credentials --region ap-south-1`
3. Hit `/ready` endpoint to check DB connectivity
