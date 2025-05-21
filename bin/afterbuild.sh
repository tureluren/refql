#!/bin/bash

FILE="./build/RefQL.js"
FILE2="./build/RefQL.d.ts"

sed -i 's|./generated/client|../../.refql/client|g' "$FILE"

sed -E '/tables:/,/options:/c\    tables: ReturnType<typeof import("../../.refql/client").getTables>;\n    options: Required<RefQLOptions>;' "$FILE2" > tmp && mv tmp "$FILE2"

rm -rf ./build/generated
