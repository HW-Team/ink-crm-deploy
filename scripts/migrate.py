#!/usr/bin/env python3
"""Ink Homes CRM — Google Sheet → Supabase migration (HWT-144).

Pulls all tabs from the legacy Google Sheet (CSV export, no OAuth),
normalizes phones, dedupes contacts, inserts leads/logs/follow-ups,
writes a migration report.

Usage:
  python3 scripts/migrate.py --sheet <id> --supabase-url <url> --service-key <key>

Note: sheet currently requires Google login (401 from datacenter IPs);
the Ink owner must share it publicly or provide a CSV dump for now.
"""

import argparse
import csv
import io
import json
import re
import sys
import urllib.request
from datetime import datetime

# ---- phone normalization (matches src/lib/supabase.ts) ----
def normalize_phone(raw):
    if not raw:
        return None
    p = re.sub(r"[^0-9+]", "", str(raw))
    if p.startswith("+66"):
        p = "0" + p[3:]
    elif p.startswith("66") and len(p) >= 10:
        p = "0" + p[2:]
    if not p.startswith("0"):
        return None
    return p


def fetch_csv(sheet_id, gid=None):
    url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=csv"
    if gid is not None:
        url += f"&gid={gid}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read().decode("utf-8", "replace")


def rows_from_csv(text):
    reader = csv.DictReader(io.StringIO(text))
    return list(reader)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--sheet", default="1MiUkEkptq9hKL6wiq5Rh5YygM4uNqJuyHK1YsHNySkI")
    ap.add_argument("--supabase-url", required=True)
    ap.add_argument("--service-key", required=True)
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    # TODO: map gids once access restored. Until then, accept pre-exported CSVs.
    report = {
        "run_at": datetime.utcnow().isoformat(),
        "contacts": 0, "leads": 0, "logs": 0, "follow_ups": 0,
        "dupes_merged": 0, "errors": [],
    }
    print(json.dumps(report, indent=2))
    print("\nNOTE: sheet is 401 from this host — owner must re-share publicly "
          "or provide CSV dumps. Script structure is ready for the gid map.")


if __name__ == "__main__":
    main()
