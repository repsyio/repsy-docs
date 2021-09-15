#!/usr/bin/env bash
set -e

docker login -u "$DOCKER_HUB_LOGIN" -p "$DOCKER_HUB_TOKEN"
docker build . --file Dockerfile --tag repsy/docs:"$1"
docker push repsy/docs:"$1"
