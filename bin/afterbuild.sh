#!/bin/bash

FILE="./build/RefQL.js"

sed -i 's|./generated/client|../../.refql/client|g' "$FILE"

rm -rf ./build/generated
