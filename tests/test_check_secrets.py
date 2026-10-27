import base64
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCANNER = ROOT / "tools" / "check_secrets.py"
PNG = b"\x89PNG\r\n\x1a\n" + b"synthetic"


def token(kind):
    if kind == "PEM":
        return "-----BEGIN " + "RSA " + "PRIVATE KEY-----"
    if kind == "AWS":
        return "AK" + "IA" + "A" * 16
    if kind == "GitHub":
        return "gh" + "p" + "_" + "A" * 20
    if kind == "Google":
        return "AI" + "za" + "A" * 35
    raise AssertionError(kind)


def run_scanner(files, remove=()):
    with tempfile.TemporaryDirectory() as directory:
        repo = Path(directory)
        subprocess.run(["git", "init", "-q"], cwd=repo, check=True)
        for name, content in files.items():
            path = repo / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(content)
        subprocess.run(["git", "add", "."], cwd=repo, check=True)
        for name in remove:
            (repo / name).unlink()
        return subprocess.run(
            [sys.executable, str(SCANNER)], cwd=repo,
            text=True, capture_output=True, check=False,
        )


class CheckSecretsTests(unittest.TestCase):
    def test_each_pattern_family_is_reported_without_value(self):
        kinds = ("PEM", "AWS", "GitHub", "Google")
        result = run_scanner({f"{kind}.txt": token(kind).encode() for kind in kinds})
        self.assertEqual(result.returncode, 1, result.stdout + result.stderr)
        for kind in kinds:
            self.assertIn(f"{kind}.txt:1: {kind}", result.stderr)
            self.assertNotIn(token(kind), result.stdout + result.stderr)

    def test_token_variants_remain_detected(self):
        variants = [
            ("AWS", "AS" + "IA" + "Z" * 16),
            ("GitHub", "github" + "_pat_" + "a" * 20),
            *[("GitHub", "gh" + letter + "_" + "a" * 20) for letter in "pousr"],
        ]
        for kind, value in variants:
            with self.subTest(kind=kind, prefix=value[:4]):
                result = run_scanner({"key.txt": value.encode()})
                self.assertEqual(result.returncode, 1, result.stdout + result.stderr)
                self.assertIn(kind, result.stderr)
                self.assertNotIn(value, result.stderr)

    def test_valid_raster_data_uri_collision_is_ignored(self):
        # The encoded representation has a token-shaped substring, not the bytes.
        apparent = token("Google").encode()
        prefix = b"\x89PNG\r\n\x1a\n" + b"x"
        payload = prefix + base64.b64decode(apparent + b"A")
        uri = b"data:image/png;base64," + base64.b64encode(payload)
        self.assertIn(apparent, uri)
        result = run_scanner({"page.html": b"<img src='" + uri + b"'>"})
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_decoded_raster_bytes_are_scanned(self):
        kinds = ("PEM", "AWS", "GitHub", "Google")
        hidden = b"\n".join(token(kind).encode() for kind in kinds)
        uri = b"data:image/png;base64," + base64.b64encode(PNG + hidden)
        result = run_scanner({"page.html": b"<img src='" + uri + b"'>"})
        self.assertEqual(result.returncode, 1, result.stdout + result.stderr)
        for kind in kinds:
            self.assertIn(f"page.html:1: {kind}", result.stderr)
            self.assertNotIn(token(kind), result.stdout + result.stderr)

    def test_invalid_non_raster_and_generic_data_uris_are_not_exempted(self):
        apparent = token("Google").encode()
        cases = (
            b"data:image/png;base64," + apparent + b"!",
            b"data:image/png;base64," + apparent + b"A",
            b"data:text/plain;base64," + apparent + b"A",
        )
        for value in cases:
            with self.subTest(prefix=value[:25]):
                result = run_scanner({"page.html": value})
                self.assertEqual(result.returncode, 1, result.stdout + result.stderr)
                self.assertIn("Google", result.stderr)

    def test_real_secret_next_to_raster_uri_is_reported(self):
        uri = b"data:image/png;base64," + base64.b64encode(PNG)
        value = token("GitHub").encode()
        result = run_scanner({"page.html": uri + b" " + value})
        self.assertEqual(result.returncode, 1, result.stdout + result.stderr)
        self.assertIn("page.html:1: GitHub", result.stderr)
        self.assertNotIn(value.decode(), result.stdout + result.stderr)

    def test_non_utf8_text_does_not_bypass_scan(self):
        result = run_scanner({"legacy.txt": b"\xff " + token("AWS").encode()})
        self.assertEqual(result.returncode, 1, result.stdout + result.stderr)
        self.assertIn("legacy.txt:1: AWS", result.stderr)

    def test_unreadable_tracked_file_fails_closed(self):
        result = run_scanner({"missing.txt": b"benign"}, remove=("missing.txt",))
        self.assertEqual(result.returncode, 2, result.stdout + result.stderr)
        self.assertIn("Secret scanner failed", result.stderr)


if __name__ == "__main__":
    unittest.main()
