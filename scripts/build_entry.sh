#!/bin/bash

# Update Umami
echo Updating Umami
curl https://umami.quacs.org/umami.js >public/umami.js || exit 1

# Update our local dependencies (quacs-rs), or clone if possible
echo Retrieving latest quacs-data
git -C src/store/data pull || git clone https://github.com/quacs/quacs-data --depth=1 --branch multi-sem src/store/data || exit 1

CURR_DIR=$(dirname "${BASH_SOURCE[0]}")

BUILD_ALL=false

OUTPUT_DIR=site
SUBDOMAIN=""
while getopts ao:d option; do
	case "${option}" in

	a) BUILD_ALL=true ;;
	o) OUTPUT_DIR=${OPTARG} ;;
	d) SUBDOMAIN="staging." ;;
	*) ;; # ignore other flags
	esac
done

if test "$BUILD_ALL" != "true"; then
	# We're only building one semester
	SEMESTER=$(basename "$(find src/store/data/semester_data/* -type d -print0 | xargs -0 | sed 's/ /\n/g' | sort -r | head -n1)")
	echo "Building $SEMESTER..."
	"$CURR_DIR/build_single.sh" "$@" -s "$SEMESTER" || exit 1

	exit 0
fi

# We're trying to build all semesters, just do it back to back
for directory in $(find src/store/data/semester_data/* -type d -print0 | xargs -0); do
	SEMESTER=$(basename "$directory")
	echo "Building $SEMESTER..."
	"$CURR_DIR/build_single.sh" "$@" -s "$SEMESTER" || exit 1
done

LATEST_SEMESTER=$(basename "$(find src/store/data/semester_data/* -type d -print0 | xargs -0 | sed 's/ /\n/g' | sort -r | head -n1)")

# Create html entry page
cat <<EOF >"$OUTPUT_DIR/index.html"
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width,initial-scale=1.0">
    <meta name="description" content="QuACS is the new and improved course scheduler for Rensselaer Polytechnic Institute (RPI) students. Stop using YACS and start using QuACS!">
    <meta name="og:image" content="https://$SUBDOMAIN.quacs.org/img/icons/android-chrome-512x512.png" />
    <link rel="icon" href="https://$SUBDOMAIN.quacs.org/favicon.ico">
    <title>QuACS</title>
</head>

<body>
    <noscript>
        <strong>We're sorry but QuACS doesn't work properly without JavaScript enabled. Please enable it to continue.</strong>
    </noscript>
		<script type="text/javascript>
				window.location.href = "https://$SUBDOMAIN.quacs.org/$LATEST_SEMESTER"
		</script>
</body>

</html>
EOF