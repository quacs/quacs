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

git submodule update --init --recursive
cd src/quacs-rs
wasm-pack build $FLAGS && mv pkg/* .
