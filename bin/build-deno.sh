#!/bin/bash
echo "> building Deno"

deno_dir=./deno
src_dir=./src

sedi="-i"
if [[ "$OSTYPE" == "darwin"* ]]; then
  sedi="-i ''"
fi

# delete and recreate deno folder
rm -rf $deno_dir || true
mkdir $deno_dir

# list with folders and files in $src_dir
dir_list=`ls $src_dir`

# copy folders and files to $deno_dir
for dir_item in $dir_list
do
  file_path="$src_dir/$dir_item"
  deno_path="$deno_dir/$dir_item"
  if [[ -d $file_path ]]; then
    cp -r $file_path $deno_path
  else [[ -f $file_path ]]
    cp $file_path $deno_path
  fi
done

# replace implied index paths
for dir_item in $dir_list
do
  file_path="$src_dir/$dir_item"
  if [[ -d $file_path ]]; then
    search_implied_index="import (.*) from (.*)\/$dir_item\";"
    replace_implied_index="import \1 from \2\/$dir_item\/index\";"
    find $deno_dir -type f -exec sed $sedi -E "s/$search_implied_index/$replace_implied_index/g" {} \;
  fi
done

# create mod.ts file
echo "export * from \"./index.ts\";" > "$deno_dir/mod.ts"

# remove unnecessary files
rm -rf "$deno_dir/test"
rm "$deno_dir/soccer.ts"
rm "$deno_dir/workbench.ts"

# remove test files
find $deno_dir -name "*.spec.ts" -type f -delete
find $deno_dir -name "*.test.ts" -type f -delete

# place .ts in paths
search_path="import (.*) from (.*)\";"
replace_path="import \1 from \2.ts\";"
find $deno_dir -type f -exec sed $sedi -E "s/$search_path/$replace_path/g" {} \;

# correct ..ts with ./index.ts
search_mistake="import (.*) from \"..ts\";"
replace_mistake="import \1 from \".\/index.ts\";"
find $deno_dir -type f -exec sed $sedi -E "s/$search_mistake/$replace_mistake/g" {} \;

# correct types with types.ts (multiline problem)
search_types="from (.*)types\";"
replace_types="from \1types.ts\";"
find $deno_dir -type f -exec sed $sedi -E "s/$search_types/$replace_types/g" {} \;

# copy README file
cp README.md $deno_dir

# prepare README for Deno
search_pg="import { Pool } from \"pg\";"
replace_pg="import postgres from \"https:\/\/deno.land\/x\/postgresjs\/mod.js\";"
sed -i $sedi "s/$search_pg/$replace_pg/g" "$deno_dir/README.md"

search_refql="from \"refql\";"
replace_refql="from \"https:\/\/deno.land\/x\/refql\/mod.ts\";"
sed -i $sedi "s/$search_refql/$replace_refql/g" "$deno_dir/README.md"

search_pool="const pool = new Pool ({"
replace_pool="const pool = postgres ({"
sed -i $sedi "s/$search_pool/$replace_pool/g" "$deno_dir/README.md"

search_querier="pool.query (query, values).then (({ rows }) => rows);"
replace_querier="pool.unsafe (query, values);"
sed -i $sedi "s/$search_querier/$replace_querier/g" "$deno_dir/README.md"

echo "> finished building Deno"