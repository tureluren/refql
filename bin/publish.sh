#!/bin/bash

BUILD_DIR=build

cd $BUILD_DIR

cp ../{.npmignore,package.json,README.md} .

npm publish

cd ..