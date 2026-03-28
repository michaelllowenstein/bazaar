# ECS Deployment Guide — Bazaar

## Overview

Bazaar runs as a single ECS Fargate task. The container hosts both the Svelte
frontend (served by nginx on port 80) and the Fastify API (on `127.0.0.1:3000`,
internal only). Nginx proxies `/api/` to Fastify and serves the built SPA for
all other routes. SQLite data is persisted on an EFS volume.

---

## Prerequisites

- AWS CLI v2 configured with appropriate permissions
- Docker Desktop with `linux/amd64` build support
- An EFS file system created in the same VPC as your ECS cluster
- A Secrets Manager secret containing the JWT secret (see Configuration)

---

## Environment Variables

| Variable      | Required | Description                                       |
|---------------|----------|---------------------------------------------------|
| `NODE_ENV`    | Yes      | Must be `production`                              |
| `PORT`        | Yes      | Fastify port — must be `3000`                     |
| `HOST`        | Yes      | Must be `127.0.0.1` (localhost only, nginx proxies) |
| `DB_PATH`     | Yes      | Path to SQLite file — use `/data/bazaar.db`       |
| `CORS_ORIGIN` | Yes      | Your public domain e.g. `https://bazaar.example.com` |
| `JWT_SECRET`  | Yes      | Min 32 chars — inject via Secrets Manager         |

Set `JWT_SECRET` via AWS Secrets Manager, not as a plain environment variable.
The task definition references the secret ARN under `secrets`.

---

## First-time Setup

### 1. Create required IAM roles

```bash
# ecsTaskExecutionRole — allows ECS to pull images and write logs
# ecsTaskRole — allows the container to access EFS and Secrets Manager
# (Use the AWS console or your org's IaC — these are standard ECS roles)
```

### 2. Create the EFS file system

```bash
aws efs create-file-system \
  --performance-mode generalPurpose \
  --throughput-mode bursting \
  --region YOUR_REGION \
  --tags Key=Name,Value=bazaar-data
```

Note the `FileSystemId` (e.g. `fs-abc12345`) and update `ecs-task-definition.json`.

### 3. Create the JWT secret

```bash
aws secretsmanager create-secret \
  --name bazaar/jwt-secret \
  --secret-string "$(openssl rand -base64 48)" \
  --region YOUR_REGION
```

Note the ARN and update `ecs-task-definition.json`.

### 4. Update placeholder values in task definition

Edit `ecs-task-definition.json` and replace:
- `ACCOUNT_ID` → your 12-digit AWS account ID
- `REGION` → your AWS region (e.g. `us-east-1`)
- `fs-XXXXXXXX` → your EFS file system ID
- `YOUR_DOMAIN` → your public domain

---

## Build and Push

```bash
cd base-app

export AWS_REGION=us-east-1
export AWS_ACCOUNT_ID=123456789012
export ECR_REPO=bazaar

# Build the multi-stage image and push to ECR
./build-and-push-ecs.sh

# To also register the task definition in one step:
REGISTER_TASK=true ./build-and-push-ecs.sh
```

---

## Database Seeding

SSH into a running task or use ECS Exec to seed the database on first deploy:

```bash
# Enable ECS Exec on your cluster (one-time)
aws ecs update-cluster \
  --cluster YOUR_CLUSTER \
  --configuration executeCommandConfiguration='{"logging":"DEFAULT"}'

# Run seed inside the running container
aws ecs execute-command \
  --cluster YOUR_CLUSTER \
  --task TASK_ID \
  --container bazaar \
  --interactive \
  --command "node /app/src/db/migrate.js && node /app/src/db/seed-public.js"
```

---

## Deployment

```bash
# Update the running service to use the new task definition revision
aws ecs update-service \
  --cluster YOUR_CLUSTER \
  --service bazaar \
  --task-definition bazaar \
  --force-new-deployment \
  --region YOUR_REGION
```

---

## Health Check

The `/health` endpoint returns `200 OK` without authentication:

```bash
curl https://YOUR_DOMAIN/health
# {"status":"ok"}
```

ECS considers the task healthy only after this check passes. The task definition
configures a 30-second `startPeriod` to allow migrations to complete before
health checks begin.

---

## Logs

```bash
aws logs tail /ecs/bazaar --follow --region YOUR_REGION
```

---

## SQLite + ECS Considerations

- SQLite on EFS has higher latency than local disk. The WAL journal mode (set
  in `migrate.js`) minimises this for read-heavy workloads.
- Run **one task at a time** — SQLite does not support concurrent writers across
  processes. If you need to scale, run a single writer task and add a read
  replica or switch to PostgreSQL.
- Back up the EFS volume using AWS Backup before any migration.

---

## Rollback

```bash
# List recent task definition revisions
aws ecs list-task-definitions --family-prefix bazaar --sort DESC

# Roll back to a previous revision
aws ecs update-service \
  --cluster YOUR_CLUSTER \
  --service bazaar \
  --task-definition bazaar:PREVIOUS_REVISION \
  --region YOUR_REGION
```
