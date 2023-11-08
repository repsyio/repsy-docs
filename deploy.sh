#!/usr/bin/env bash
set -e

tag="$1-$(date '+%y%m%d%H%M')"

docker login -u "$DOCKER_HUB_LOGIN" -p "$DOCKER_HUB_TOKEN"
docker build . --file Dockerfile --tag repsy/repsy-docs:"$tag"
docker push repsy/repsy-docs:"$tag"

if [[ $1 = "prod" ]];
then
  docker build . --file Dockerfile --tag repsy/repsy-docs:latest
  docker push repsy/repsy-docs:latest
fi

mkdir -p ~/.kube
echo "$K8S_CONFIG" | md5sum
echo "$K8S_CONFIG" > ~/.kube/config

echo "
apiVersion: apps/v1
kind: Deployment
metadata:
  name: repsy-docs
  namespace: repsy-docs
spec:
  replicas: 1
  selector:
    matchLabels:
      app: repsy-docs
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1
      maxSurge: 1
  template:
    metadata:
      labels:
        app: repsy-docs
    spec:
      containers:
        - name: repsy-docs
          image: repsy/repsy-docs:$tag
          imagePullPolicy: Always
          ports:
            - containerPort: 80
" | kubectl apply -f -
