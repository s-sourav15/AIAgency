locals {
  name_prefix = "${var.project_name}-${var.env}"
}

# ---------- Data Sources: Default VPC + Subnets ----------

data "aws_vpc" "default" {
  id = "vpc-07a5ad2ac0aeb92a7"
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# ---------- DB Subnet Group ----------

resource "aws_db_subnet_group" "this" {
  name       = "${local.name_prefix}-rds-subnets"
  subnet_ids = data.aws_subnets.default.ids

  tags = {
    Name    = "${local.name_prefix}-rds-subnets"
    Project = var.project_name
    Env     = var.env
  }
}

# ---------- Security Group ----------

resource "aws_security_group" "rds" {
  name        = "${local.name_prefix}-rds"
  description = "Allow PostgreSQL access to ${local.name_prefix} RDS"
  vpc_id      = data.aws_vpc.default.id

  tags = {
    Name    = "${local.name_prefix}-rds"
    Project = var.project_name
    Env     = var.env
  }
}

resource "aws_security_group_rule" "postgres_ingress" {
  count             = length(var.allowed_cidrs) > 0 ? 1 : 0
  type              = "ingress"
  from_port         = 5432
  to_port           = 5432
  protocol          = "tcp"
  cidr_blocks       = var.allowed_cidrs
  security_group_id = aws_security_group.rds.id
  description       = "PostgreSQL from allowed CIDRs"
}

resource "aws_security_group_rule" "egress_all" {
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.rds.id
  description       = "Allow all outbound"
}

# ---------- Master Password ----------

resource "random_password" "master" {
  length           = 32
  special          = true
  override_special = "!#$%&*()-_=+[]{}|:,.<>?"
}

# ---------- Secrets Manager ----------

resource "aws_secretsmanager_secret" "rds_credentials" {
  name        = "${local.name_prefix}-rds-credentials"
  description = "RDS PostgreSQL credentials for ${local.name_prefix}"

  tags = {
    Project = var.project_name
    Env     = var.env
  }
}

resource "aws_secretsmanager_secret_version" "rds_credentials" {
  secret_id = aws_secretsmanager_secret.rds_credentials.id
  secret_string = jsonencode({
    username = "aiagency_admin"
    password = random_password.master.result
    host     = aws_db_instance.this.address
    port     = 5432
    dbname   = "aiagency"
    engine   = "postgres"
  })
}

# ---------- RDS Instance ----------

resource "aws_db_instance" "this" {
  identifier = "${local.name_prefix}-postgres"

  engine         = "postgres"
  engine_version = "16"
  instance_class = var.instance_class

  allocated_storage = var.allocated_storage
  storage_type      = "gp3"
  storage_encrypted = true

  db_name  = "aiagency"
  username = "aiagency_admin"
  password = random_password.master.result

  db_subnet_group_name   = aws_db_subnet_group.this.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false

  backup_retention_period = 7
  multi_az                = false
  deletion_protection     = true
  skip_final_snapshot     = false
  final_snapshot_identifier = "${local.name_prefix}-postgres-final-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"

  apply_immediately = true

  performance_insights_enabled = true
  enabled_cloudwatch_logs_exports = ["postgresql"]

  # TODO: create custom parameter group with pg_stat_statements enabled

  tags = {
    Name    = "${local.name_prefix}-postgres"
    Project = var.project_name
    Env     = var.env
  }

  lifecycle {
    ignore_changes = [final_snapshot_identifier]
  }
}
