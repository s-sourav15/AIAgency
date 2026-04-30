# ECS Fargate — Backend

Deploys the FastAPI backend on AWS ECS Fargate with an Application Load Balancer.

## Architecture

```
Internet → ALB (:80) → ECS Fargate Task (backend:8000) → RDS PostgreSQL
```

## Prerequisites

- Terraform >= 1.5
- AWS CLI configured with access to account `474132537731`
- RDS module already applied (provides the database and secrets)

## Deploy Steps

### 1. Provision Infrastructure

```bash
cd infra/terraform/ecs
terraform init
terraform apply
```

This creates the ECR repo, ECS cluster, ALB, IAM roles, and security groups.
The ECS service will fail to stabilize until an image is pushed.

### 2. Push Docker Image

```bash
# Get the ECR repo URL from Terraform output
ECR_URL=$(terraform output -raw ecr_repo_url)

# Login to ECR
aws ecr get-login-password --region ap-south-1 | \
  docker login --username AWS --password-stdin 474132537731.dkr.ecr.ap-south-1.amazonaws.com

# Build and push (from repo root)
cd ../../..
docker build --platform linux/amd64 -t $ECR_URL:latest .
docker push $ECR_URL:latest
```

### 3. Force New Deployment

```bash
aws ecs update-service \
  --cluster aiagency-prod \
  --service aiagency-prod-backend \
  --force-new-deployment \
  --region ap-south-1
```

### 4. Verify

```bash
ALB_DNS=$(cd infra/terraform/ecs && terraform output -raw alb_dns_name)
curl http://$ALB_DNS/health
# Expected: {"status":"ok"}
```

## Cost Estimate (ap-south-1)

| Resource | Monthly Cost |
|----------|-------------|
| Fargate (0.5 vCPU, 1 GB, 1 task, 24/7) | ~$15-18 |
| ALB (fixed hourly + LCU) | ~$16 |
| ECR (< 1 GB storage) | < $1 |
| CloudWatch Logs | < $1 |
| **Total** | **~$33-36/mo** |

## Logs

```bash
aws logs tail /ecs/aiagency-prod-backend --follow --region ap-south-1
```

## ECS Exec (SSH into container)

```bash
aws ecs execute-command \
  --cluster aiagency-prod \
  --task <TASK_ID> \
  --container backend \
  --interactive \
  --command "/bin/bash" \
  --region ap-south-1
```

Requires the Session Manager plugin installed locally.

## Notes

- Terraform state is stored locally (matching the RDS module). Migrate to S3 backend later.
- HTTPS not configured in v1 — add ACM certificate and HTTPS listener when domain is ready.
- Fargate tasks get public IPs to reach external APIs (Anthropic, Replicate, OpenAI) without a NAT gateway.
