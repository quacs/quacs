#!/bin/sh

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
git -C src/store/data pull || git clone https://github.com/quacs/quacs-data src/store/data
ln -srf ./src/store/data ./src/quacs-rs/src/
cd src/quacs-rs/
wasm-pack build $FLAGS && mv pkg/* .
