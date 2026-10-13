#!/usr/bin/env bash
# Runs the Cypress e2e suite the way CI does: builds and serves the test semester (summer 2021) with
# `yarn test:serve`, waits for it, runs Cypress headlessly against it, then stops the server.
# Arguments go to `cypress run`, e.g. `yarn test:e2e:ci --spec tests/e2e/specs/themes.js`.
#
# Like `yarn test:serve`, this rebuilds .env and the WebAssembly for the test semester, so stop any
# `yarn serve` first and start it again afterwards. It tests against your quacs-data checkout as it
# is instead of pulling, since the test semester's data doesn't change.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

PORT=${PORT:-8080}
export PORT
BASE_URL="http://localhost:$PORT/summer2021/"

if curl --silent --max-time 2 --output /dev/null "http://localhost:$PORT/"; then
	echo "Something is already listening on port $PORT (yarn serve?). Stop it, or set PORT." >&2
	exit 1
fi

# build_entry.sh checks out this exact data instead of pulling, when it's set
if test -d src/store/data/.git; then
	QUACS_DATA_SHA=$(git -C src/store/data rev-parse HEAD)
	export QUACS_DATA_SHA
fi

LOG=$(mktemp)
# Job control gives the server its own process group, so stopping it stops the whole build too
set -m
yarn test:serve >"$LOG" 2>&1 &
SERVER=$!
set +m
trap 'kill -- -$SERVER 2>/dev/null || true; wait $SERVER 2>/dev/null || true; rm -f "$LOG"' EXIT

echo "Building and serving the test semester on port $PORT..."
until curl --silent --fail --max-time 2 "$BASE_URL" | grep --quiet QuACS; do
	if ! kill -0 "$SERVER" 2>/dev/null; then
		cat "$LOG" >&2
		echo "The test server stopped before it was ready." >&2
		exit 1
	fi
	sleep 1
done

node_modules/.bin/cypress run --config "baseUrl=$BASE_URL" "$@"
