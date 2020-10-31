#!/bin/bash

# If we don't have a current semester to build with set, default to this one
# This should only apply if you're building locally to test
if test -z "$CURR_SEMESTER"; then
	CURR_SEMESTER="202101"
fi

if test x"$1" == x"debug"; then
	echo "Building debug release"
	FLAGS="-- --features debug"
else
	echo "Building production release"
	FLAGS=""
fi

if test -z "$DONT_BENCHMARK_QUACS"; then
	if test -z "$FLAGS"; then
		FLAGS="--"
	fi

	FLAGS="$FLAGS --features benchmark"
fi

# Update Umami
echo Updating Umami
curl https://umami.quacs.org/umami.js >public/umami.js

# Update our local dependencies (quacs-rs), or clone if possible
echo Retrieving latest quacs-data
git -C src/store/data pull || git clone https://github.com/quacs/quacs-data --depth=1 --branch multi-semester src/store/data

echo Setting quacs-rs to build for $CURR_SEMESTER
mkdir src/quacs-rs/data || rm -rf src/quacs-rs/data/*
cp -r src/store/data/semester_data/$CURR_SEMESTER/mod.rs src/quacs-rs/data

echo Setting .env file
rm .env
echo "VUE_APP_CURR_SEM=$CURR_SEMESTER" >>.env
echo -n "VUE_APP_ALL_SEMS=[" >>.env
ITER=0
for directory in $(find src/store/data/semester_data -print0 | xargs -0); do
	if test ITER -ne 0; then
		echo -n "," >>.env
	fi
	echo -n "\"$directory\"" >>.env
	ITER=$((ITER + 1))
done
echo "]" >>.env

echo Building quacs-rs
cd src/quacs-rs
wasm-pack build $FLAGS && mv pkg/* .

echo WASM build complete
