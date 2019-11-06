#!/usr/bin/env bash

set -e

solc_version=$(solc --version | grep Version)

if [[ ${solc_version:9:6} != '0.5.12' ]]; then
  echo "Bad solc version ${solc_version:9}. Use 0.5.12"
  exit 1
fi

mkdir -p abi && rm -r abi
mkdir -p abi/bin abi/json

solc --abi --bin -o abi --allow-paths . @openzeppelin=${INIT_CWD:-.}/node_modules/@openzeppelin contracts/**/*.sol --optimize --optimize-runs 200 >/dev/null

find abi -name '*.bin' -type f -size 0 -empty -delete
find abi -name '*.bin' -exec sh -c 'mv "$0" abi/bin 2>/dev/null' {} \;
find abi -name '*.abi' -exec sh -c 'mv "$0" "abi/json/$(basename ${0%.abi}.json)" 2>/dev/null' {} \;
