#!/bin/bash

if [ $DB_TYPE == "mysql" ]
then
  echo "> creating MySQL docker container"
  docker rm -f dev-mysql || true
  docker run --name dev-mysql \
  --restart always \
  -p 3306:3306 \
  -e MYSQL_PASSWORD=test \
  -e MYSQL_ROOT_PASSWORD=test \
  -e MYSQL_USER=test \
  -e MYSQL_DATABASE=soccer \
  -d mysql:8.0.30
elif [ $DB_TYPE == "mariadb" ]
then
  echo "> creating MariaDB docker container"
  docker rm -f dev-mariadb || true
  docker run --name dev-mariadb \
  --restart always \
  -p 3307:3306 \
  -e MARIADB_PASSWORD=test \
  -e MARIADB_ROOT_PASSWORD=test \
  -e MARIADB_USER=test \
  -e MARIADB_DATABASE=soccer \
  -d mariadb:10.8
else
  echo "> creating PostgreSQL docker container"
  docker rm -f dev-postgres || true
  docker run --name dev-postgres \
  --restart always \
  -p 3308:5432 \
  -e POSTGRES_PASSWORD=test \
  -e POSTGRES_USER=test \
  -e POSTGRES_DB=soccer \
  -d postgres:17.2;
fi