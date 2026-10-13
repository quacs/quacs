#!/usr/bin/env bash

set -eu

# Release workers use one pinned snapshot; local builds still fetch current data.
if test -n "${QUACS_DATA_SHA:-}"; then
  test "$(git -C src/store/data rev-parse HEAD)" = "$QUACS_DATA_SHA" || exit 1
else
  echo Retrieving latest quacs-data
  git -C src/store/data pull || git clone https://github.com/quacs/quacs-data --depth=2 src/store/data || exit 1
fi

CURR_DIR=$(dirname "${BASH_SOURCE[0]}")

BUILD_ALL=false
BUILD_FOR_TESTS=false

OUTPUT_DIR=site
PARTITION=0
PARTITIONS=1
SINGLE_FLAGS=()
while getopts ao:dtbnp:c: option; do
	case "${option}" in

	a) BUILD_ALL=true ;;
	o) OUTPUT_DIR=${OPTARG} ;;
	d) SINGLE_FLAGS+=(-d) ;;
	b) SINGLE_FLAGS+=(-b) ;;
	n) SINGLE_FLAGS+=(-n) ;;
	p) PARTITION=${OPTARG} ;;
	c) PARTITIONS=${OPTARG} ;;
	t) BUILD_FOR_TESTS=true ;;
	*) ;; # ignore other flags
	esac
done

[[ "$PARTITION" =~ ^[0-9]+$ && "$PARTITIONS" =~ ^[1-9][0-9]*$ ]] || exit 1
(( PARTITION < PARTITIONS )) || exit 1

if test "$BUILD_ALL" != "true"; then
	# We're only building one semester
	if test "$BUILD_FOR_TESTS" != "true"; then
		SEMESTER=$(basename "$(find src/store/data/semester_data/* -type d -print0 -maxdepth 0 | xargs -0 | sed 's/ /\n/g' | sort -r | head -n1)")
	else
		echo "Setting semester to testing semester so tests are consistent"
		# Choose an arch semester for tests because arch semesters have more features to test
		SEMESTER="202105"
	fi
	echo "Building $SEMESTER..."
	"$CURR_DIR/build_single.sh" "${SINGLE_FLAGS[@]}" -o "$OUTPUT_DIR" -s "$SEMESTER" || exit 1

	exit 0
fi

# Each worker owns disjoint semesters and has its own Rust, .env and dist directory.
# Rebuild every semester: shared JSON imports make a semester-only diff unsafe.
DIRECTORIES=(src/store/data/semester_data/*)
INDEX=0
for directory in "${DIRECTORIES[@]}"; do
  test -d "$directory" || continue
  if (( INDEX % PARTITIONS == PARTITION )); then
    SEMESTER=$(basename "$directory")
    echo "Building $SEMESTER..."
    "$CURR_DIR/build_single.sh" "${SINGLE_FLAGS[@]}" -o "$OUTPUT_DIR" -s "$SEMESTER" || exit 1
  fi
  INDEX=$((INDEX + 1))
done

# Only the first worker writes the root redirect; artifacts have no overlapping paths.
if (( PARTITION != 0 )); then
  exit 0
fi
mkdir -p "$OUTPUT_DIR"

LATEST_SEMESTER=$(python scripts/short_sem_to_long_sem.py $(basename "$(find src/store/data/semester_data/* -type d -print0 -maxdepth 0 | xargs -0 | sed 's/ /\n/g' | sort -r | head -n1)"))

# Create html entry page
cat <<EOF >"$OUTPUT_DIR/index.html"
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width,initial-scale=1.0">
    <meta name="description" content="QuACS is the new and improved course scheduler for Rensselaer Polytechnic Institute students.  We're always up to date, and always accurate.">
    <meta name="keywords" content="RPI,Rensselaer Polytechnic Institute,YACS,registration,course planning,planner">
    <meta name="og:image" content="/img/icons/android-chrome-512x512.png" />
    <link rel="icon" href="/favicon.ico">
    <meta http-equiv="Refresh" content="0; url='/$LATEST_SEMESTER'" />
    <title>QuACS</title>
</head>

<body>
</body>

</html>
EOF
