#!/bin/bash

# Update Umami
echo Updating Umami
curl https://umami.quacs.org/umami.js >public/umami.js || exit 1

# Update our local dependencies (quacs-rs), or clone if possible
echo Retrieving latest quacs-data
git -C src/store/data pull || git clone https://github.com/quacs/quacs-data --depth=1 --branch multi-sem src/store/data || exit 1

CURR_DIR=$(dirname "${BASH_SOURCE[0]}")

BUILD_ALL=false

while getopts a option; do
	case "${option}" in

	a) BUILD_ALL=true ;;
	*) ;; # ignore other flags
	esac
done

if test "$BUILD_ALL" = "true"; then
	# We're trying to build all semesters, just do it back to back
	for directory in $(find src/store/data/semester_data/* -type d -print0 | xargs -0); do
		SEMESTER=$(basename "$directory")
		echo "Building $SEMESTER..."
		"$CURR_DIR/build_single.sh" "$@" -s "$SEMESTER" || exit 1
	done
else
	# We're only building one semester
	SEMESTER=$(basename "$(find src/store/data/semester_data/* -type d -print0 | xargs -0 | sed 's/ /\n/g' | sort -r | head -n1)")
	echo "Building $SEMESTER..."
	"$CURR_DIR/build_single.sh" "$@" -s "$SEMESTER" || exit 1
fi
