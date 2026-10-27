#!/usr/bin/env python3
"""Scan tracked text for known secret patterns without printing secret values.

Raster data URIs are special-cased only after strict Base64 and raster-signature
validation. Decoded bytes are also scanned: only accidental matches in the
encoded representation are suppressed.
"""
from __future__ import annotations

import base64
import binascii
import re
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path

# Preserve the four families and semantics from the original workflow.
PATTERNS: tuple[tuple[str, re.Pattern[bytes]], ...] = (
    ("PEM", re.compile(rb"-----BEGIN [A-Z ]*PRIVATE KEY-----")),
    ("AWS", re.compile(rb"(?:AKIA|ASIA)[0-9A-Z]{16}")),
    ("GitHub", re.compile(rb"(?:gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,})")),
    ("Google", re.compile(rb"AIza[0-9A-Za-z_-]{35}")),
)
RASTER_SIGNATURES = (
    b"\x89PNG\r\n\x1a\n",
    b"GIF87a",
    b"GIF89a",
    b"\xff\xd8\xff",  # JPEG
    b"BM",  # BMP
    b"II*\x00",  # TIFF
    b"MM\x00*",
)
DATA_URI_PREFIX = re.compile(
    rb"data:image/(?:png|jpe?g|gif|bmp|tiff?|webp);base64,", re.IGNORECASE
)
URI_END = frozenset(b" \t\r\n\"'<>`)]}")


@dataclass(frozen=True)
class Finding:
    path: str
    line: int
    kind: str


def _is_raster(payload: bytes) -> bool:
    return payload.startswith(RASTER_SIGNATURES) or (
        len(payload) >= 12 and payload.startswith(b"RIFF") and payload[8:12] == b"WEBP"
    )


def _data_uri_spans(line: bytes) -> tuple[list[tuple[int, int]], list[bytes]]:
    """Find strictly encoded raster containers; never exempt generic data URIs."""
    spans: list[tuple[int, int]] = []
    decoded: list[bytes] = []
    for prefix in DATA_URI_PREFIX.finditer(line):
        end = prefix.end()
        while end < len(line) and line[end] not in URI_END:
            end += 1
        try:
            payload = base64.b64decode(line[prefix.end():end], validate=True)
        except (binascii.Error, ValueError):
            continue
        if _is_raster(payload):
            spans.append((prefix.start(), end))
            decoded.append(payload)
    return spans, decoded


def _overlaps(start: int, end: int, spans: list[tuple[int, int]]) -> bool:
    return any(start < span_end and end > span_start for span_start, span_end in spans)


def _scan_line(path: str, number: int, line: bytes) -> list[Finding]:
    spans, payloads = _data_uri_spans(line)
    findings: list[Finding] = []
    for kind, pattern in PATTERNS:
        if any(not _overlaps(m.start(), m.end(), spans) for m in pattern.finditer(line)):
            findings.append(Finding(path, number, kind))
        if any(pattern.search(payload) for payload in payloads):
            findings.append(Finding(path, number, kind))
    return findings


def _tracked_files(root: Path) -> list[Path]:
    result = subprocess.run(
        ["git", "ls-files", "-z"], cwd=root, check=True, stdout=subprocess.PIPE
    )
    return [root / item for item in result.stdout.decode("utf-8").split("\0") if item]


def scan(root: Path) -> list[Finding]:
    findings: list[Finding] = []
    for path in _tracked_files(root):
        relative = path.relative_to(root).as_posix()
        # Preserve exactly the pre-existing documentation/workflow exclusions.
        if relative in {"SECURITY.md", ".github/workflows/security.yml"}:
            continue
        data = path.read_bytes()  # Reading failures must fail the job, not hide files.
        if b"\x00" in data:  # Match the original git grep -I binary exclusion.
            continue
        # Scan bytes directly; non-UTF-8 text must not bypass the detector.
        for number, line in enumerate(data.splitlines(), 1):
            findings.extend(_scan_line(relative, number, line))
    return sorted(set(findings), key=lambda item: (item.path, item.line, item.kind))


def main() -> int:
    try:
        root = Path(subprocess.check_output(
            ["git", "rev-parse", "--show-toplevel"], text=True
        ).strip())
        findings = scan(root)
    except (OSError, subprocess.CalledProcessError, UnicodeError) as exc:
        print(f"Secret scanner failed: {exc}", file=sys.stderr)
        return 2
    if findings:
        for item in findings:
            print(f"{item.path}:{item.line}: {item.kind}", file=sys.stderr)
        print("Potential secret detected. Remove it and rotate it before merging.", file=sys.stderr)
        return 1
    print("No likely secrets detected.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
