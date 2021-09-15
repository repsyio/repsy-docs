#!/usr/bin/env bash
set -e

mkdir -p ~/.kube
echo "$K8S_CONFIG" > ~/.kube/config

echo "
apiVersion: apps/v1
kind: Deployment
metadata:
  name: repsy-docs
  namespace: repsy
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
          image: repsy/docs:$1
          imagePullPolicy: Always
          ports:
            - containerPort: 80
" | kubectl apply -f -
