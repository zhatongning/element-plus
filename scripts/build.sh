#!/bin/sh

set -e

pnpm build:new

pnpm build:theme
pnpm build:locale
pnpm build:utils
pnpm build:hooks
pnpm build:directives
pnpm build:tokens
pnpm build:full-bundle

rsync -a dist/entry/types/ dist/element-plus/es/
rsync -a dist/entry/types/ dist/element-plus/lib/

pnpm build:helper

echo "copy index.css"
cp dist/element-plus/theme-chalk/index.css dist/element-plus/dist/index.css
cp -R dist/element-plus/theme-chalk/fonts dist/element-plus/dist/fonts

echo "syncing style.js"
rsync -a dist/styles/es/ dist/element-plus/es/components/
rsync -a dist/styles/lib/ dist/element-plus/lib/components/

echo "copying source code"
cp -R packages dist/element-plus
cp packages/element-plus/package.json dist/element-plus/package.json

echo "copying README"
cp README.md dist/element-plus
