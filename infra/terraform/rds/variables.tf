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

variable "allowed_cidrs" {
  description = "CIDR blocks allowed to connect to RDS on port 5432"
  type        = list(string)
  default     = []
}

variable "instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t4g.micro"
}

variable "allocated_storage" {
  description = "Allocated storage in GB"
  type        = number
  default     = 20
}
