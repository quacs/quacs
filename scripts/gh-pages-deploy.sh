#!/bin/sh

set -x

git checkout --orphan gh-pages || exit 1
yarn build || exit 1
echo 'quacs.org' > dist/CNAME
git --work-tree dist add --all || exit 1
git --work-tree dist commit -m "$(date -u)" || exit 1
git push origin HEAD:gh-pages --force || exit 1
rm -r dist
git checkout -f master || exit 1
git branch -D gh-pages || exit 1
