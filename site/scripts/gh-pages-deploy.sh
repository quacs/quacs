#!/bin/sh

set -x

# If current branch == staging
if git rev-parse --abbrev-ref HEAD | grep -w staging >/dev/null; then
	BRANCH="staging"
	CNAME="staging.quacs.org"
	ACTION="debug-build"
else
	BRANCH="master"
	CNAME="quacs.org"
	ACTION="build"
fi

if ! test -d gh-pages-site/; then
	# This should only occur when testing locally
	git clone git@github.com:quacs/site.git gh-pages-site/
fi

git -C gh-pages-site checkout -B ${BRANCH} || exit 1

cp scripts/service-worker.js gh-pages-site/service-worker.js
cp LICENSE gh-pages-site/LICENSE
echo ${CNAME} >gh-pages-site/CNAME

yarn ${ACTION} ${BUILD_ARGS} -a -o gh-pages-site || exit 1

git -C gh-pages-site add --all || exit 1
git -C gh-pages-site commit -m "$(date -u)" || { echo "No site changes to commit!"; exit 0; }
git -C gh-pages-site push origin HEAD:${BRANCH} --force || exit 1
