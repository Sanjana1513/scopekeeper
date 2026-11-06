"""Canonical SHA-256 checksums for exported ScopeKeeper evidence."""
import argparse
import hashlib
import hmac
import json
from pathlib import Path


def evidence_digest(bundle):
    payload = {key: value for key, value in bundle.items() if key != "sha256"}
    canonical = json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def verify_evidence(bundle, expected=None):
    saved = bundle.get("sha256")
    if not isinstance(saved, str) or not saved.isascii():
        return False
    digest = evidence_digest(bundle)
    return hmac.compare_digest(saved, digest) and (
        expected is None or (expected.isascii() and hmac.compare_digest(expected, digest))
    )


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("bundle", type=Path)
    parser.add_argument("--expected", help="SHA-256 copied separately at export time")
    args = parser.parse_args()
    try:
        bundle = json.loads(args.bundle.read_text(encoding="utf-8"))
        valid = isinstance(bundle, dict) and verify_evidence(bundle, args.expected)
    except (OSError, ValueError):
        valid = False
    print("Evidence checksum matches." if valid else "Evidence checksum mismatch or invalid file.")
    return int(not valid)


if __name__ == "__main__":
    raise SystemExit(main())
