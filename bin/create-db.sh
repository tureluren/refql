#!/bin/bash

version="${1:-13.5}"

docker rm -f dev-postgres || true
docker run --name dev-postgres \
--restart always \
-p 5432:5432 \
-e POSTGRES_PASSWORD=test \
-e POSTGRES_USER=test \
-e POSTGRES_DB=soccer \
-d postgres:$version