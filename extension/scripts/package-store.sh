#!/usr/bin/env sh
# Package the extension as a clean Chrome Web Store submission ZIP.
# The archive is built from a whitelist into a staging directory, so tests,
# sources, node_modules, store docs and build scripts cannot leak into it.
set -eu

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
extension_dir=$(CDPATH= cd -- "$script_dir/.." && pwd)

version=$(sed -n 's/^  "version": "\([^"]*\)",$/\1/p' "$extension_dir/manifest.json")
if [ -z "$version" ]; then
    echo "error: could not read the version from manifest.json" >&2
    exit 1
fi

for artifact in dist/zhtw_mcp_wasm.js dist/zhtw_mcp_wasm_bg.wasm; do
    if [ ! -f "$extension_dir/$artifact" ]; then
        echo "error: $artifact is missing. Run: sh extension/build-wasm.sh" >&2
        exit 1
    fi
done

out_dir="$extension_dir/store-assets"
out="$out_dir/zhtw-extension-v$version.zip"

stage=$(mktemp -d 2>/dev/null || mktemp -d -t zhtw-store-zip)
trap 'rm -rf "$stage"' EXIT HUP INT TERM

mkdir -p "$stage/src" "$stage/styles" "$stage/icons" "$stage/dist"
cp "$extension_dir/manifest.json" "$extension_dir/popup.html" "$stage/"
cp "$extension_dir"/src/*.js "$stage/src/"
cp "$extension_dir"/styles/*.css "$stage/styles/"
for size in 16 32 48 128; do
    cp "$extension_dir/icons/icon-$size.png" "$stage/icons/"
done
cp "$extension_dir/dist/zhtw_mcp_wasm.js" "$extension_dir/dist/zhtw_mcp_wasm_bg.wasm" "$stage/dist/"

mkdir -p "$out_dir"
rm -f "$out"
(cd "$stage" && zip -qr "$out" .)

size=$(wc -c < "$out" | tr -d ' ')
echo "Packaged $out ($size bytes)"
