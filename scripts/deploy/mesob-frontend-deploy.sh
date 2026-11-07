#!/usr/bin/env bash
# Executed remotely over SSH as mesobdeploy. No root shell required.
set -Eeuo pipefail
umask 027

SHA="${1:?Missing commit SHA}"
[[ "$SHA" =~ ^[a-f0-9]{40}$ ]] || { echo 'Invalid commit SHA' >&2; exit 2; }
ID="fe_${SHA}"
BASE=/var/www/mesob-frontend-releases
INCOMING="$BASE/shared/incoming"
RELEASES="$BASE/releases"
TARGET="$RELEASES/$ID"
ARCHIVE="$INCOMING/mesob-frontend-${SHA}.zip"
CHECKSUM="$ARCHIVE.sha256"
CACHE=/var/lib/mesobruntime/next-cache

# Serialize preparation, including competing workflow runs.
exec 8>"$BASE/shared/.frontend-install.lock"
flock -x 8

test -d "$RELEASES"
test -f "$ARCHIVE"
test -f "$CHECKSUM"
(
  cd "$INCOMING"
  sha256sum -c -- "$(basename "$CHECKSUM")"
)

# Validate ZIP names, types, duplicates and size before extraction.
# The archive is built by GitHub Actions; this check also protects against corruption.
python3 - "$ARCHIVE" <<'PY'
import pathlib
import stat
import sys
import zipfile

archive = pathlib.Path(sys.argv[1])
seen = set()
total = 0
with zipfile.ZipFile(archive) as zf:
    for entry in zf.infolist():
        name = entry.filename
        parts = pathlib.PurePosixPath(name).parts
        if (not name or name.startswith('/') or '\\' in name or
                any(part in ('', '.', '..') for part in name.rstrip('/').split('/')) or
                ':' in parts[0]):
            raise SystemExit(f'Unsafe ZIP member: {name!r}')
        normalized = name.rstrip('/')
        if normalized in seen:
            raise SystemExit(f'Duplicate ZIP member: {name!r}')
        seen.add(normalized)
        mode = (entry.external_attr >> 16) & 0xffff
        if mode and not (stat.S_ISREG(mode) or stat.S_ISDIR(mode)):
            raise SystemExit(f'Unsupported ZIP member type: {name!r}')
        total += entry.file_size
        if total > 2 * 1024**3:
            raise SystemExit('ZIP uncompressed size exceeds 2 GiB limit')
    bad = zf.testzip()
    if bad:
        raise SystemExit(f'ZIP integrity failed: {bad}')
PY

if [ -e "$TARGET" ] || [ -L "$TARGET" ]; then
  test -f "$TARGET/RELEASE_INFO.txt"
  grep -Fxq "commit=$SHA" "$TARGET/RELEASE_INFO.txt"
  echo "Existing verified release: $ID"
else
  STAGE="$(mktemp -d "$RELEASES/.install-${ID}.XXXXXXXX")"
  chmod 750 "$STAGE"
  cleanup() { if [ -n "${STAGE:-}" ] && [ -d "$STAGE" ]; then rm -rf -- "$STAGE"; fi; }
  trap cleanup EXIT

  unzip -q "$ARCHIVE" -d "$STAGE"
  test -s "$STAGE/server.js"
  test -s "$STAGE/.next/BUILD_ID"
  test -f "$STAGE/node_modules/next/package.json"
  test -s "$STAGE/package-lock.json"
  test -d "$STAGE/.next/static"
  grep -Fxq "repository=Temamamankabeto/ms_front" "$STAGE/RELEASE_INFO.txt"
  grep -Fxq "commit=$SHA" "$STAGE/RELEASE_INFO.txt"
  test ! -e "$STAGE/.next/cache"
  test ! -L "$STAGE/.next/cache"
  # Cache is owned by mesobruntime and may not be traversable by mesobdeploy.
  # A symlink can be installed without accessing its destination.
  ln -s "$CACHE" "$STAGE/.next/cache"
  mv -T -- "$STAGE" "$TARGET"
  STAGE=''
  trap - EXIT
  echo "Prepared release: $ID"
fi

# The restricted root-owned script owns activation, health checks and rollback.
# A release is never activated unless all installation checks have passed.
printf '%s\n' "$ID" | sudo -n /usr/local/sbin/mesob-frontend-activate
