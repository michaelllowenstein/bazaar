#!/usr/bin/env bash
set -euo pipefail

# ── Configuration ─────────────────────────────────────────────────────────────
# Set these before running, or export them in your shell environment.
AWS_REGION="${AWS_REGION:?AWS_REGION is required}"
AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID:?AWS_ACCOUNT_ID is required}"
ECR_REPO="${ECR_REPO:-bazaar}"
IMAGE_TAG="${IMAGE_TAG:-latest}"

ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
FULL_IMAGE="${ECR_REGISTRY}/${ECR_REPO}:${IMAGE_TAG}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "▶ Building Bazaar ECS image"
echo "  Registry : ${ECR_REGISTRY}"
echo "  Image    : ${FULL_IMAGE}"
echo ""

# ── ECR login ─────────────────────────────────────────────────────────────────
echo "▶ Authenticating with ECR…"
aws ecr get-login-password --region "${AWS_REGION}" \
  | docker login --username AWS --password-stdin "${ECR_REGISTRY}"

# ── Create repo if it doesn't exist ───────────────────────────────────────────
aws ecr describe-repositories --repository-names "${ECR_REPO}" \
    --region "${AWS_REGION}" > /dev/null 2>&1 \
  || aws ecr create-repository --repository-name "${ECR_REPO}" \
       --region "${AWS_REGION}" > /dev/null

# ── Build ─────────────────────────────────────────────────────────────────────
echo "▶ Building Docker image…"
docker build \
  --platform linux/amd64 \
  -f "${SCRIPT_DIR}/Dockerfile.ecs" \
  -t "${FULL_IMAGE}" \
  "${SCRIPT_DIR}"

# ── Push ──────────────────────────────────────────────────────────────────────
echo "▶ Pushing image to ECR…"
docker push "${FULL_IMAGE}"

echo ""
echo "✓ Image pushed: ${FULL_IMAGE}"
echo ""

# ── Optional: register task definition ───────────────────────────────────────
if [[ "${REGISTER_TASK:-false}" == "true" ]]; then
  echo "▶ Registering ECS task definition…"
  # Replace placeholder values in task definition
  TASK_DEF=$(sed \
    -e "s|ACCOUNT_ID|${AWS_ACCOUNT_ID}|g" \
    -e "s|REGION|${AWS_REGION}|g" \
    "${SCRIPT_DIR}/ecs-task-definition.json")

  TASK_ARN=$(echo "${TASK_DEF}" \
    | aws ecs register-task-definition \
        --region "${AWS_REGION}" \
        --cli-input-json file:///dev/stdin \
      | jq -r '.taskDefinition.taskDefinitionArn')

  echo "✓ Task definition registered: ${TASK_ARN}"
fi

echo "▶ Done."