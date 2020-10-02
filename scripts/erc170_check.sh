#!/usr/bin/env bash

yarn compile >/dev/null

too_big=()

for file in $(dirname $0)/../abi/bin/*.bin; do
  if ((0xC000 < $(wc -m <$file))); then
    too_big+=($file)
  fi
done

if ((${#too_big[@]} > 0)); then
  echo 'The following files are too big to be erc170 compatable. See https://eips.ethereum.org/EIPS/eip-170'

  echo

  for ((i = 0; i < ${#too_big[@]}; i++)); do
    echo '    '$(basename ${too_big[$i]} .bin)'.sol'
  done

  echo

  exit 1

fi
