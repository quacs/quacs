# Cypress's prebuilt Electron app, made to run under Nix, at the version site/yarn.lock pins: the
# cypress npm package expects an app of its own version (it warns that others may not work), and
# nixpkgs packages only the newest Cypress. This follows nixpkgs' recipe for it. The dev shell
# points CYPRESS_RUN_BINARY here, and `nix flake check` fails when yarn.lock moves to a version
# this doesn't provide.
{
  lib,
  stdenv,
  fetchzip,
  autoPatchelfHook,
  wrapGAppsHook3,
  makeWrapper,
  makeFontsConf,
  alsa-lib,
  gtk3,
  libgbm,
  nss,
  udev,
  dejavu_fonts,
  liberation_ttf,
}:

let
  version = "13.17.0";

  binaries = {
    x86_64-linux = {
      platform = "linux-x64";
      hash = "sha256-1W13AfXVRWTmDSRdsaPfSSJNlf59JXdI92tXBbYwdDI=";
    };
    aarch64-linux = {
      platform = "linux-arm64";
      hash = "sha256-R8PQyu4AeTDqR/+miJd4eXkqBG9JEPbzKJjy8IQcEeg=";
    };
  };
  binary =
    binaries.${stdenv.hostPlatform.system}
      or (throw "cypress: no ${version} binary for ${stdenv.hostPlatform.system}");

  # A fixed set of fonts, like the ones on CI's Ubuntu runners, so specs that measure text
  # (navbar-width.js) see the same widths on every machine
  fonts = makeFontsConf {
    fontDirectories = [
      dejavu_fonts
      liberation_ttf
    ];
  };
in
stdenv.mkDerivation {
  pname = "cypress";
  inherit version;

  src = fetchzip {
    url = "https://cdn.cypress.io/desktop/${version}/${binary.platform}/cypress.zip";
    inherit (binary) hash;
  };

  nativeBuildInputs = [
    autoPatchelfHook
    wrapGAppsHook3
    makeWrapper
  ];

  buildInputs = [
    alsa-lib
    gtk3
    libgbm
    nss
  ];

  # Electron loads udev at run time
  runtimeDependencies = [ (lib.getLib udev) ];

  # Shrinking the RPATHs would drop libraries Electron opens at run time
  dontPatchELF = true;

  # The executable is wrapped by hand below, in place
  dontWrapGApps = true;

  installPhase = ''
    runHook preInstall

    mkdir -p $out/opt/cypress $out/bin
    cp -r . $out/opt/cypress
    ln -s $out/opt/cypress/Cypress $out/bin/cypress

    # The npm package resolves CYPRESS_RUN_BINARY to its real path, wants it named Cypress, and keeps
    # its verified flag one folder up. Its first-run check would write that flag into the read-only
    # store, so it ships already set.
    echo '{"verified": true}' > $out/opt/binary_state.json

    runHook postInstall
  '';

  # Wrap the executable where it is, since that path is the one the npm package accepts. The wrapper
  # gives it GTK's settings schemas and the fixed fonts.
  postFixup = ''
    mv $out/opt/cypress/Cypress $out/opt/cypress/.Cypress-wrapped
    makeWrapper $out/opt/cypress/.Cypress-wrapped $out/opt/cypress/Cypress \
      "''${gappsWrapperArgs[@]}" \
      --set FONTCONFIG_FILE ${fonts}
  '';

  meta = {
    description = "Cypress test runner, at the version QuACS's yarn.lock pins";
    homepage = "https://www.cypress.io";
    license = lib.licenses.mit;
    sourceProvenance = [ lib.sourceTypes.binaryNativeCode ];
    platforms = lib.attrNames binaries;
    mainProgram = "cypress";
  };
}
