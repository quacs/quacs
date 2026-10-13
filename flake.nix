{
  description = "QuACS - The Questionably Accurate Course Scheduler";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
    rust-overlay = {
      url = "github:oxalica/rust-overlay";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs =
    {
      nixpkgs,
      flake-utils,
      rust-overlay,
      ...
    }:
    let
      # The systems nixpkgs still supports (26.11 dropped x86_64-darwin)
      systems = [
        "x86_64-linux"
        "aarch64-linux"
        "aarch64-darwin"
      ];
    in
    flake-utils.lib.eachSystem systems (
      system:
      let
        pkgs = import nixpkgs {
          inherit system;
          overlays = [ rust-overlay.overlays.default ];
        };
        inherit (pkgs) lib;
        inherit (pkgs.stdenv.hostPlatform) isLinux;

        # Pinned to 1.86 with the wasm32 target; see the comment in the toolchain file.
        rustToolchain = pkgs.rust-bin.fromRustupToolchainFile ./site/src/quacs-rs/rust-toolchain.toml;

        # wasm-pack needs a wasm-bindgen CLI matching the version in Cargo.lock.
        # Providing it on PATH stops wasm-pack from downloading a prebuilt binary.
        wasm-bindgen-cli = pkgs.buildWasmBindgenCli rec {
          src = pkgs.fetchCrate {
            pname = "wasm-bindgen-cli";
            version = "0.2.89";
            hash = "sha256-IPxP68xtNSpwJjV2yNMeepAS0anzGl02hYlSTvPocz8=";
          };
          cargoDeps = pkgs.rustPlatform.fetchCargoVendor {
            inherit src;
            inherit (src) pname version;
            hash = "sha256-EsGFW1f9+E5NnMadP/0rRzFCxVJQb0mlTLz/3zYQ5Ac=";
          };
        };

        # The site uses webpack 4, which needs --openssl-legacy-provider (set by
        # build_single.sh). Node 16 from .node-version is no longer in nixpkgs.
        nodejs = pkgs.nodejs_22;

        # Cypress made to run under Nix, for the e2e tests. Linux only: on macOS the npm package's
        # own download runs as it is.
        cypress = pkgs.callPackage ./nix/cypress.nix { };

        # The Cypress version site/yarn.lock pins, which ./nix/cypress.nix has to match
        lockedCypress =
          let
            entry =
              lib.findFirst (block: lib.hasPrefix "cypress@" block || lib.hasPrefix "\"cypress@" block)
                (throw "site/yarn.lock has no cypress entry")
                (lib.splitString "\n\n" (builtins.readFile ./site/yarn.lock));
            line =
              lib.findFirst (lib.hasPrefix "  version ") (throw "site/yarn.lock's cypress entry has no version")
                (lib.splitString "\n" entry);
          in
          builtins.head (builtins.match "  version \"(.*)\"" line);

        python = pkgs.python3.withPackages (
          ps: with ps; [
            aiohttp
            beautifulsoup4
            lxml
            requests
            tqdm
            datadog
            black
          ]
        );
      in
      {
        devShells = {
          default = pkgs.mkShell {
            packages = [
              rustToolchain
              wasm-bindgen-cli
              pkgs.wasm-pack
              pkgs.binaryen
              nodejs
              (pkgs.yarn.override { inherit nodejs; })
              python
              pkgs.git
              pkgs.rsync
              # Used by the build scripts
              pkgs.bash
              pkgs.coreutils
              pkgs.findutils
              pkgs.gnused
              pkgs.gnugrep
            ]
            ++ lib.optionals isLinux [
              # Cypress starts a virtual display when there's no DISPLAY
              pkgs.xvfb
            ];

            # Cypress's own download is an Electron app that can't find its libraries under Nix, so on
            # Linux the npm package skips it and runs ./nix/cypress.nix instead
            env = lib.optionalAttrs isLinux {
              CYPRESS_INSTALL_BINARY = "0";
              CYPRESS_RUN_BINARY = "${cypress}/opt/cypress/Cypress";
            };

            shellHook = ''
              export PATH="$PWD/site/node_modules/.bin:$PATH"
            '';
          };

          scrapers = pkgs.mkShell {
            packages = [ python ];
          };
        };

        packages = lib.optionalAttrs isLinux { inherit cypress; };

        checks = lib.optionalAttrs isLinux {
          # Fails once site/yarn.lock moves Cypress to a version ./nix/cypress.nix doesn't provide
          cypress-version = pkgs.runCommand "cypress-version" { } (
            if lockedCypress == cypress.version then
              "touch $out"
            else
              ''
                echo "site/yarn.lock has cypress ${lockedCypress}, but nix/cypress.nix has ${cypress.version}." >&2
                echo "Update the version and hashes in nix/cypress.nix to match." >&2
                exit 1
              ''
          );
        };

        formatter = pkgs.nixfmt;
      }
    );
}
