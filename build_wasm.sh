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

# Update our local dependencies (quacs-rs, quacs-data), or clone if possible
git -C src/store/data pull || git clone https://github.com/quacs/quacs-data src/store/data
git -C src/quacs-rs pull || git clone https://github.com/quacs/quacs-rs src/quacs-rs

ln -srf ./src/store/data ./src/quacs-rs/src/
cd src/quacs-rs/
wasm-pack build $FLAGS && mv pkg/* .
