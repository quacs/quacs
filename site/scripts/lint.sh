#!/bin/bash

set -eu

echo Running vue linter
vue-cli-service lint "$@"

echo Retrieving latest quacs-data for quacs-rs
git -C src/store/data pull || git clone https://github.com/quacs/quacs-data --depth=1 src/store/data || exit 1

echo Linting quacs-rs
cargo clippy --manifest-path src/quacs-rs/Cargo.toml -- -D warnings
