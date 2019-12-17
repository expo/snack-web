#! /usr/bin/env nix-shell
#! nix-shell -i bash -p kustomize kubectl
#! nix-shell -I nixpkgs=../../

set -xeuo pipefail

ENVIRONMENT=$1
TAG=$2
MESSAGE=${3:-"Deployed by $(whoami)"}
IMAGE="gcr.io/exponentjs/snack:$TAG"

gcloud container images describe "$IMAGE"

cd "deploy/${ENVIRONMENT}"

kustomize edit set image "$IMAGE"
kustomize edit add annotation kubernetes.io/change-cause:"$(date): $MESSAGE"

kubectl apply --kustomize . --validate

kubectl --namespace "$ENVIRONMENT" rollout status deploy snack
