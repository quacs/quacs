#!/bin/sh

set -x

# If current branch == staging
if git rev-parse --abbrev-ref HEAD | grep -w staging > /dev/null; then
  BRANCH="staging"
  PAGESBRANCH="gh-pages-staging"
  CNAME="staging.quacs.org"
else
  BRANCH="master"
  PAGESBRANCH="gh-pages"
  CNAME="quacs.org"
fi

git checkout --orphan ${PAGESBRANCH} || exit 1
yarn build || exit 1
echo ${CNAME} > dist/CNAME
git --work-tree dist add --all || exit 1
git --work-tree dist commit -m "$(date -u)" || exit 1
git push origin HEAD:${PAGESBRANCH} --force || exit 1
rm -r dist
git checkout -f ${BRANCH} || exit 1
git branch -D ${PAGESBRANCH} || exit 1
