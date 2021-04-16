#!/bin/bash

set -eu

echo "Running vue linter"
vue-cli-service lint "$@"

echo "Retrieving latest quacs-data for quacs-rs"
git -C src/store/data pull || git clone https://github.com/quacs/quacs-data --depth=1 src/store/data || exit 1

semesters=(src/store/data/semester_data/*)
curr_semester="$(basename ${semesters[-1]})"
echo "Setting quacs-rs to build for $curr_semester"
mkdir src/quacs-rs/src/data || rm -rf src/quacs-rs/src/data/*
cp src/store/data/semester_data/$curr_semester/*.rs src/quacs-rs/src/data

echo "Linting quacs-rs"
cargo clippy --manifest-path src/quacs-rs/Cargo.toml -- -D warnings

echo "Running tests for quacs-rs"
cargo test --manifest-path src/quacs-rs/Cargo.toml
wasm-pack test --node src/quacs-rs
