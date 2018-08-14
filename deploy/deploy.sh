#!/usr/bin/env bash

set -xeo pipefail

environment=$1

if [ "$environment" == "production" ]; then
  s3bucket=expo-static-assets-prod
  export REPLICAS=2
  export INGRESS_HOSTNAME=snack.expo.io
  export ENV_SUBDOMAIN_PREFIX=""
elif [ "$environment" == "staging" ]; then
  s3bucket=expo-static-assets-staging
  export REPLICAS=2
  export INGRESS_HOSTNAME=staging.snack.expo.io
  export ENV_SUBDOMAIN_PREFIX="staging."
else
  echo "Unrecognized environment $environment"
  exit 1
fi

export TAG=$2

echo "Checking for image..."

if ! retry5 gcloud container images describe "gcr.io/exponentjs/snack:$TAG"; then
  echo "Unable to find image tagged with $TAG"
  exit 2
fi

echo "Environment set, found image, deploying..."

envsubst < deploy/snack.k8s.template.yml | kubectl apply --namespace $environment -f -
