#!/bin/bash

if [ $DB_TYPE == "pg" ]
then
  echo "> creating PostgreSQL docker container"
  docker rm -f dev-postgres || true
  docker run --name dev-postgres \
  --restart always \
  -p 5432:5432 \
  -e POSTGRES_PASSWORD=test \
  -e POSTGRES_USER=test \
  -e POSTGRES_DB=soccer \
  -d postgres:13.5;
elif [ $DB_TYPE == "mysql" ]
then
  echo "> creating MySql docker container"
  docker rm -f dev-mysql || true
  docker run --name dev-mysql \
  --restart always \
  -p 3306:3306 \
  -e MYSQL_PASSWORD=test \
  -e MYSQL_ROOT_PASSWORD=test \
  -e MYSQL_USER=test \
  -e MYSQL_DATABASE=soccer \
  -d mysql:8.0.30
fi