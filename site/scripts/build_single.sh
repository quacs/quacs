#!/bin/bash

# This script builds a single semester (stored in $CURR_SEMESTER).  It relies on some setup
# from build_entry.sh (namely setting up one-time dependencies like Umami and quacs-data)
# so it should never be called on its own.

ROOT_DIRECTORY=$(pwd)

DEBUG=false
DONT_BENCHMARK=false
BUILD_SITE=false
OUTPUT_DIR=site
while getopts dnbs:o: option; do
	case "${option}" in

	d) DEBUG=true ;;
	s) CURR_SEMESTER=${OPTARG} ;;
	n) DONT_BENCHMARK=true ;;
	b) BUILD_SITE=true ;;
	o) OUTPUT_DIR=${OPTARG} ;;
	*) ;; # ignore other flags
	esac
done

if test "$DEBUG" == "true"; then
	echo "Building debug release"
	FLAGS="-- --features debug"
else
	echo "Building production release"
	FLAGS=""
fi

if test "$DONT_BENCHMARK" = "false"; then
	if test -z "$FLAGS"; then
		FLAGS="--"
	fi

	FLAGS="$FLAGS --features benchmark"
fi

echo Setting quacs-rs to build for "$CURR_SEMESTER"
mkdir src/quacs-rs/src/data || rm -rf src/quacs-rs/src/data/*
cp src/store/data/semester_data/$CURR_SEMESTER/*.rs src/quacs-rs/src/data

QUACS_COMMIT_HASH=$(git rev-parse HEAD)
QUACS_DATA_COMMIT_HASH=$(git -C src/store/data/semester_data rev-parse HEAD)

echo "Got QuACS hash: $QUACS_COMMIT_HASH"
echo "Got QUACS-data hash: $QUACS_DATA_COMMIT_HASH"

echo Setting .env file
rm .env
echo "VUE_APP_CURR_SEM=$CURR_SEMESTER" >>.env
printf "VUE_APP_SEMS_IN_SEARCH=" >>.env
cat src/store/data/terms_in_course_search.json >>.env
echo -n "VUE_APP_ALL_SEMS=[" >>.env
ITER=0
for directory in $(find src/store/data/semester_data/* -type d -print0 -maxdepth 0 | xargs -0 | sed 's/ /\n/g' | sort -r); do
	if test $ITER -ne 0; then
		echo -n "," >>.env
	fi
	echo -n "\"$(basename $directory)\"" >>.env
	ITER=$((ITER + 1))
done
echo "]" >>.env

echo "VUE_APP_QUACS_HASH=\"$QUACS_COMMIT_HASH\"" >> .env
echo "VUE_APP_DATA_HASH=\"$QUACS_DATA_COMMIT_HASH\"" >> .env

echo Building quacs-rs
cd src/quacs-rs
wasm-pack build $FLAGS && mv pkg/* .
echo WASM build complete

cd "$ROOT_DIRECTORY"

echo Building site
if test "$BUILD_SITE" = "true"; then
	vue-cli-service build || exit 1

	mkdir -p "$OUTPUT_DIR"
	CURR_SEM_LONG=$(python scripts/short_sem_to_long_sem.py $CURR_SEMESTER)
	rsync -av --delete dist/ "$OUTPUT_DIR/$CURR_SEM_LONG"
else
	vue-cli-service serve
fi
