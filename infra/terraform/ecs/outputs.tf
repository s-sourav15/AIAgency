output "ecr_repo_url" {
  description = "ECR repository URL for the backend image"
  value       = aws_ecr_repository.backend.repository_url
}

output "cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.this.name
}

output "service_name" {
  description = "ECS service name"
  value       = aws_ecs_service.backend.name
}

output "alb_dns_name" {
  description = "ALB DNS name (use this to reach the API)"
  value       = aws_lb.this.dns_name
}

output "log_group_name" {
  description = "CloudWatch log group for backend containers"
  value       = aws_cloudwatch_log_group.backend.name
}

output "ecs_task_sg_id" {
  description = "Security group ID attached to ECS tasks"
  value       = aws_security_group.ecs_tasks.id
}
