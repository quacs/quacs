# Release builds

The frontend embeds `VUE_APP_CURR_SEM`, the semester URL, semester JSON,
shared prerequisite data and metadata, and a semester-specific Rust/WASM scheduler.
A single compiled bundle cannot currently serve every semester unchanged.

Previously, a full release built approximately 90 semesters sequentially. Hourly
scrapes requested `-d`, which selected only semester paths in `HEAD~1..HEAD`.
That selection could miss shared JSON updates and data commits since the last
successful deployment. The same flag also enabled Rust debug features.

## Parallel full releases

`gh-pages-deploy.yml` resolves one quacs-data commit before starting six isolated
workers. Each worker checks out that exact commit and builds every sixth semester
in sorted directory order. Its `.env`, generated Rust source, WASM package and
Vue `dist` directory are private to the worker. No semester shares mutable build
files with another concurrent build. Yarn downloads and Rust dependencies are
cached; final bundles are always freshly compiled.

Each worker uploads a uniquely named artifact. Only worker zero supplies the
root redirect, so merged artifacts have disjoint paths. The publishing job waits
for all workers, assembles their artifacts and verifies an HTML entry and WASM
binary for every semester in the pinned snapshot before updating quacs/site.
Any build, validation or transfer failure prevents publishing and meta updates.
Production uses release features; staging retains debug features.

Pull requests changing the release scripts or workflow run the full build and
validation without publishing or updating metadata. This validates all historical
semesters before merging changes to the release process.

The expensive build phase now has roughly 15 sequential semesters per worker
instead of 90 on one worker. Actual wall time depends on available runners,
semester compilation times, setup and artifact transfers. Total compilation work
is similar, with additional worker setup overhead; this is a latency improvement,
not a promise of lower Actions usage. Measure the first live runs before adding
more workers.

## Local commands

From `site`, `yarn build -a` still builds every semester sequentially.
`yarn build -a -p 0 -c 6 -o release-site` builds batch zero of six.
Run other batches in separate checkouts, never concurrently in the same directory.
`QUACS_DATA_SHA` pins an already checked-out data repository and rejects a
mismatched commit. Without it, local commands fetch the current data as before.
`-d` enables debug features; it no longer skips semesters. `-t` preserves the
fixed summer 2021 test semester, and `-n` disables benchmarks.

Run `python scripts/test_release.py` to check partition coverage, argument
forwarding, snapshot validation, build failure handling and incomplete-release
rejection without downloading data or compiling the application.

A future larger improvement would load semester data and WASM at runtime and
compile the shared frontend once. That requires checking scheduler compatibility,
semester navigation, service-worker caches and old URLs; this release deliberately
keeps the existing per-semester application architecture.
