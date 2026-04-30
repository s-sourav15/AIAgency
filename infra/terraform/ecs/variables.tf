variable "project_name" {
  description = "Project name used for resource naming and tagging"
  type        = string
  default     = "aiagency"
}

variable "env" {
  description = "Environment (e.g. prod, staging)"
  type        = string
  default     = "prod"
}

variable "image_tag" {
  description = "Docker image tag to deploy"
  type        = string
  default     = "latest"
}

variable "desired_count" {
  description = "Number of ECS tasks to run"
  type        = number
  default     = 1
}

variable "cpu" {
  description = "Fargate task CPU units (256, 512, 1024, 2048, 4096)"
  type        = string
  default     = "512"
}

variable "memory" {
  description = "Fargate task memory in MiB"
  type        = string
  default     = "1024"
}

variable "rds_security_group_id" {
  description = "Security group ID of the RDS instance (to allow ingress from ECS)"
  type        = string
  default     = "sg-0bcadac7242314f7c"
}

variable "rds_secret_arn" {
  description = "ARN of the Secrets Manager secret containing RDS credentials"
  type        = string
  default     = "arn:aws:secretsmanager:ap-south-1:474132537731:secret:aiagency-prod-rds-credentials-z5fPtR"
}

variable "container_port" {
  description = "Port the container listens on"
  type        = number
  default     = 8000
}

variable "anthropic_secret_arn" {
  description = "ARN of Secrets Manager secret for ANTHROPIC_API_KEY (optional)"
  type        = string
  default     = ""
}

variable "replicate_secret_arn" {
  description = "ARN of Secrets Manager secret for REPLICATE_API_TOKEN (optional)"
  type        = string
  default     = ""
}

variable "openai_secret_arn" {
  description = "ARN of Secrets Manager secret for OPENAI_API_KEY (optional)"
  type        = string
  default     = ""
}
