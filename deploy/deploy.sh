#!/usr/bin/env bash

set -xeuo pipefail

ENVIRONMENT=$1
export TAG=$2

nix run expo.k8s-services.snack.${ENVIRONMENT}.deploy --command deploy
