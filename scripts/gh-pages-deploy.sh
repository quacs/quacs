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

# clear existing data
rm gh-pages-site/* -rf

yarn ${ACTION} -a -o gh-pages-site || exit 1
# echo ${CNAME} > site/CNAME # TODO: uncomment this when quacs.org points to the new repo
git -C gh-pages-site add --all || exit 1
git -C gh-pages-site commit -m "$(date -u)" || exit 1
git -C gh-pages-site push origin HEAD:${BRANCH} --force || exit 1
