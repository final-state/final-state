#!/bin/bash

set -e

VERSION=$1

if [[ $VERSION =~ [0-9]+\.[0-9]+\.[0-9]+ ]]
then
  node scripts/update-readme.js $VERSION
  yarn publish --new-version $VERSION
  git status
else
  echo "VERSION not correct!"
fi
