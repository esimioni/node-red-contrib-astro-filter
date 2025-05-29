#!/bin/bash

VERSION=$(jq -r '.version' package.json)
NAME="node-red-contrib-astro-filter-$VERSION.tgz"

echo "Creating package for Node-RED Astro Filter version $VERSION..."

npm test || { echo '>>> Tests failed, aborting!' ; exit 1; }

rm -rf *.tgz package

mkdir package
cp astro-* package/
cp package.json package/
cp README.md package/

tar -czf $NAME package

rm -rf package

bold=$(tput bold)
normal=$(tput sgr0)

echo "Package created: $NAME"
echo "${bold}To install${normal}"
echo "Place it in your Node-RED user directory (typically ~/.node-red)"
echo "cd ~/.node-red"
echo "npm install $NAME"
echo "Restart Node-RED."