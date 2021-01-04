#!/bin/sh

set -x

# If current branch == staging
if git rev-parse --abbrev-ref HEAD | grep -w staging >/dev/null; then
	BRANCH="staging"
	CNAME="oxystaging.quacs.org"
	ACTION="oxy-debug-build"
else
	BRANCH="master"
	CNAME="oxy.quacs.org"
	ACTION="oxy-build"
fi

if ! test -d gh-pages-site/; then
	# This should only occur when testing locally
	git clone git@github.com:NickyBoy89/quacs-oxy-site.git gh-pages-site/
fi

git -C gh-pages-site checkout -B ${BRANCH} || exit 1

# clear existing data
rm gh-pages-site/* -rf

cp scripts/service-worker.js gh-pages-site/service-worker.js
cp LICENSE gh-pages-site/LICENSE
echo ${CNAME} >gh-pages-site/CNAME

yarn ${ACTION} -a -o oxy-gh-pages-site || exit 1

git -C gh-pages-site add --all || exit 1
git -C gh-pages-site commit -m "$(date -u)" || exit 1
git -C gh-pages-site push origin HEAD:${BRANCH} --force || exit 1
