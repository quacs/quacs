#!/bin/sh

set -x

# If current branch == staging
if git rev-parse --abbrev-ref HEAD | grep -w staging > /dev/null; then
  BRANCH="gh-pages-staging"
  CNAME="staging.quacs.org"
else
  BRANCH="gh-pages"
  CNAME="quacs.org"
fi

git checkout --orphan ${BRANCH} || exit 1
yarn build || exit 1
echo ${CNAME} > dist/CNAME
git --work-tree dist add --all || exit 1
git --work-tree dist commit -m "$(date -u)" || exit 1
git push origin HEAD:${BRANCH} --force || exit 1
rm -r dist
git checkout -f master || exit 1
git branch -D ${BRANCH} || exit 1
