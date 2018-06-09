#!/bin/bash
root="$(readlink -f "$(dirname "$0")")"
docker run -it --rm --network=host -u "$(id -u)" -v "${root}:/code" -w /code node:9.10.0 sh -c 'yarn && yarn run serve'
