"""Tests for scripts/audit_markers.py.

Uses unittest.mock to patch subprocess.run and simulate gh responses.
"""

import argparse
import json
import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))

import audit_markers


class TestComputeHash:
    def test_stable_across_line_changes(self):
        """Same file + text should produce the same hash regardless of line number."""
        h1 = audit_markers.compute_hash("src/ts/foo.ts", "TODO: fix the thing")
        h2 = audit_markers.compute_hash("src/ts/foo.ts", "TODO: fix the thing")
        assert h1 == h2
        assert len(h1) == 6

    def test_changes_when_text_changes(self):
        """Different text should produce a different hash."""
        h1 = audit_markers.compute_hash("src/ts/foo.ts", "TODO: fix the thing")
        h2 = audit_markers.compute_hash("src/ts/foo.ts", "TODO: fix the other thing")
        assert h1 != h2

    def test_changes_when_file_changes(self):
        """Different file with same text should produce a different hash."""
        h1 = audit_markers.compute_hash("src/ts/foo.ts", "TODO: fix the thing")
        h2 = audit_markers.compute_hash("src/ts/bar.ts", "TODO: fix the thing")
        assert h1 != h2


class TestLoadSaveRegistry:
    def test_load_missing_returns_empty(self, tmp_path, monkeypatch):
        monkeypatch.setattr(audit_markers, "REGISTRY_PATH", tmp_path / "nonexistent.json")
        reg = audit_markers.load_registry()
        assert reg == {"markers": {}}

    def test_round_trip(self, tmp_path, monkeypatch):
        path = tmp_path / "registry.json"
        monkeypatch.setattr(audit_markers, "REGISTRY_PATH", path)
        original = {
            "markers": {
                "abc123": {
                    "file": "src/ts/foo.ts",
                    "type": "TODO",
                    "text": "fix the thing",
                    "ticket": 42,
                    "status": "mapped",
                }
            }
        }
        audit_markers.save_registry(original)
        loaded = audit_markers.load_registry()
        assert loaded == original


class TestPruneRegistry:
    def test_removes_stale_entries(self):
        h_active = audit_markers.compute_hash("src/ts/foo.ts", "TODO: fix")
        h_stale = audit_markers.compute_hash("src/ts/bar.ts", "BUG: crash")
        registry = {
            "markers": {
                h_active: {"file": "src/ts/foo.ts", "type": "TODO", "text": "fix"},
                h_stale: {"file": "src/ts/bar.ts", "type": "BUG", "text": "crash"},
            }
        }
        markers = [
            {"file": "src/ts/foo.ts", "line": 1, "type": "TODO", "raw": "TODO: fix"},
        ]
        removed = audit_markers.prune_registry(registry, markers)
        assert removed == [h_stale]
        assert h_active in registry["markers"]
        assert h_stale not in registry["markers"]

    def test_no_removal_when_all_active(self):
        h = audit_markers.compute_hash("src/ts/foo.ts", "TODO: fix")
        registry = {
            "markers": {
                h: {"file": "src/ts/foo.ts", "type": "TODO", "text": "fix"},
            }
        }
        markers = [
            {"file": "src/ts/foo.ts", "line": 1, "type": "TODO", "raw": "TODO: fix"},
        ]
        removed = audit_markers.prune_registry(registry, markers)
        assert removed == []


class TestFindCandidates:
    def test_ranks_by_similarity(self):
        marker = {"raw": "TODO: fix the canvas padding"}
        issues = [
            {"number": 1, "title": "Unrelated feature request"},
            {"number": 2, "title": "Fix the canvas padding issue"},
            {"number": 3, "title": "Canvas padding is broken"},
        ]
        candidates = audit_markers.find_candidates(marker, issues, top_n=2)
        assert len(candidates) == 2
        # "Canvas padding is broken" should be first (high word overlap)
        # Either #2 or #3 could be first depending on SequenceMatcher; both are reasonable
        assert candidates[0]["number"] in (2, 3)

    def test_empty_when_no_good_matches(self):
        marker = {"raw": "TODO: something completely unique xyz123"}
        issues = [
            {"number": 1, "title": "Unrelated thing"},
        ]
        candidates = audit_markers.find_candidates(marker, issues, top_n=3)
        assert candidates == []


class TestStripPrefix:
    def test_strips_prefix(self):
        assert audit_markers.strip_prefix("TODO: fix thing") == "fix thing"
        assert audit_markers.strip_prefix("BUG. crash") == "crash"
        assert audit_markers.strip_prefix("HACK: workaround") == "workaround"

    def test_no_prefix_unchanged(self):
        assert audit_markers.strip_prefix("just some text") == "just some text"


class TestNormalise:
    def test_collapses_whitespace(self):
        assert audit_markers.normalise("  too   much   space  ") == "too much space"

    def test_strips_backticks(self):
        assert audit_markers.normalise("`quoted`") == "quoted"


class TestMain:
    def test_no_markers(self, capsys):
        with patch.object(audit_markers, "get_git_files", return_value=[]):
            with patch.object(audit_markers, "discover_markers", return_value=[]):
                with patch("argparse.ArgumentParser.parse_args", return_value=argparse.Namespace(interactive=False, prune=False, strict=False)):
                    assert audit_markers.main() == 0

        captured = capsys.readouterr()
        assert "0 markers" in captured.out

    def test_all_mapped(self, capsys, tmp_path, monkeypatch):
        monkeypatch.setattr(audit_markers, "REGISTRY_PATH", tmp_path / "registry.json")
        h = audit_markers.compute_hash("src/ts/foo.ts", "TODO: fix")
        registry = {
            "markers": {
                h: {
                    "file": "src/ts/foo.ts",
                    "type": "TODO",
                    "text": "fix",
                    "ticket": 42,
                    "status": "mapped",
                }
            }
        }
        audit_markers.save_registry(registry)

        markers = [
            {"file": "src/ts/foo.ts", "line": 1, "type": "TODO", "raw": "TODO: fix"},
        ]

        with patch.object(audit_markers, "get_git_files", return_value=["src/ts/foo.ts"]):
            with patch.object(audit_markers, "discover_markers", return_value=markers):
                with patch("argparse.ArgumentParser.parse_args", return_value=argparse.Namespace(interactive=False, prune=False, strict=False)):
                    assert audit_markers.main() == 0

        captured = capsys.readouterr()
        assert "1 mapped" in captured.out or "1 markers: 1 mapped" in captured.out

    def test_unknown_markers_exit_nonzero(self, capsys, tmp_path, monkeypatch):
        monkeypatch.setattr(audit_markers, "REGISTRY_PATH", tmp_path / "registry.json")
        audit_markers.save_registry({"markers": {}})

        markers = [
            {"file": "src/ts/foo.ts", "line": 1, "type": "TODO", "raw": "TODO: fix the thing"},
        ]

        with patch.object(audit_markers, "get_git_files", return_value=["src/ts/foo.ts"]):
            with patch.object(audit_markers, "discover_markers", return_value=markers):
                with patch.object(audit_markers, "fetch_board_issues", return_value=[]):
                    with patch("argparse.ArgumentParser.parse_args", return_value=argparse.Namespace(interactive=False, prune=False, strict=False)):
                        assert audit_markers.main() == 1

        captured = capsys.readouterr()
        assert "1 unmapped" in captured.out

    def test_strict_mode_flags_pending(self, capsys, tmp_path, monkeypatch):
        monkeypatch.setattr(audit_markers, "REGISTRY_PATH", tmp_path / "registry.json")
        h = audit_markers.compute_hash("src/ts/foo.ts", "TODO: fix")
        registry = {
            "markers": {
                h: {
                    "file": "src/ts/foo.ts",
                    "type": "TODO",
                    "text": "fix",
                    "ticket": None,
                    "status": "pending",
                }
            }
        }
        audit_markers.save_registry(registry)

        markers = [
            {"file": "src/ts/foo.ts", "line": 1, "type": "TODO", "raw": "TODO: fix"},
        ]

        with patch.object(audit_markers, "get_git_files", return_value=["src/ts/foo.ts"]):
            with patch.object(audit_markers, "discover_markers", return_value=markers):
                with patch("argparse.ArgumentParser.parse_args", return_value=argparse.Namespace(interactive=False, prune=False, strict=False)):
                    assert audit_markers.main() == 0  # not strict, pending is ok

        with patch.object(audit_markers, "get_git_files", return_value=["src/ts/foo.ts"]):
            with patch.object(audit_markers, "discover_markers", return_value=markers):
                with patch("argparse.ArgumentParser.parse_args", return_value=argparse.Namespace(interactive=False, prune=False, strict=True)):
                    assert audit_markers.main() == 1

        captured = capsys.readouterr()
        assert "1 pending" in captured.out or "pending" in captured.out

    def test_prune_flag(self, capsys, tmp_path, monkeypatch):
        monkeypatch.setattr(audit_markers, "REGISTRY_PATH", tmp_path / "registry.json")
        h_active = audit_markers.compute_hash("src/ts/foo.ts", "TODO: fix")
        h_stale = audit_markers.compute_hash("src/ts/bar.ts", "BUG: crash")
        registry = {
            "markers": {
                h_active: {
                    "file": "src/ts/foo.ts",
                    "type": "TODO",
                    "text": "fix",
                    "ticket": 42,
                    "status": "mapped",
                },
                h_stale: {
                    "file": "src/ts/bar.ts",
                    "type": "BUG",
                    "text": "crash",
                    "ticket": None,
                    "status": "ok",
                },
            }
        }
        audit_markers.save_registry(registry)

        markers = [
            {"file": "src/ts/foo.ts", "line": 1, "type": "TODO", "raw": "TODO: fix"},
        ]

        with patch.object(audit_markers, "get_git_files", return_value=["src/ts/foo.ts"]):
            with patch.object(audit_markers, "discover_markers", return_value=markers):
                with patch("argparse.ArgumentParser.parse_args", return_value=argparse.Namespace(interactive=False, prune=True, strict=False)):
                    assert audit_markers.main() == 0

        captured = capsys.readouterr()
        assert "Pruned 1 stale" in captured.out

        loaded = audit_markers.load_registry()
        assert h_stale not in loaded["markers"]
        assert h_active in loaded["markers"]

    def test_ok_status_is_fine(self, capsys, tmp_path, monkeypatch):
        monkeypatch.setattr(audit_markers, "REGISTRY_PATH", tmp_path / "registry.json")
        h = audit_markers.compute_hash("src/ts/foo.ts", "TODO: fix")
        registry = {
            "markers": {
                h: {
                    "file": "src/ts/foo.ts",
                    "type": "TODO",
                    "text": "fix",
                    "ticket": None,
                    "status": "ok",
                }
            }
        }
        audit_markers.save_registry(registry)

        markers = [
            {"file": "src/ts/foo.ts", "line": 1, "type": "TODO", "raw": "TODO: fix"},
        ]

        with patch.object(audit_markers, "get_git_files", return_value=["src/ts/foo.ts"]):
            with patch.object(audit_markers, "discover_markers", return_value=markers):
                with patch("argparse.ArgumentParser.parse_args", return_value=argparse.Namespace(interactive=False, prune=False, strict=False)):
                    assert audit_markers.main() == 0

        captured = capsys.readouterr()
        assert "1 ok" in captured.out or "0 mapped, 1 ok" in captured.out

    def test_only_board_issues_are_candidates(self, capsys, tmp_path, monkeypatch):
        """Verify that off-board repo issues are not suggested as candidates."""
        monkeypatch.setattr(audit_markers, "REGISTRY_PATH", tmp_path / "registry.json")
        audit_markers.save_registry({"markers": {}})

        markers = [
            {"file": "src/ts/foo.ts", "line": 1, "type": "TODO", "raw": "TODO: xyz123orphanmatch"},
        ]

        # Only board issues are returned — none match this marker
        board_issues = [
            {"number": 1, "title": "completely unrelated topic abc456"},
        ]

        with patch.object(audit_markers, "get_git_files", return_value=["src/ts/foo.ts"]):
            with patch.object(audit_markers, "discover_markers", return_value=markers):
                with patch.object(audit_markers, "fetch_board_issues", return_value=board_issues):
                    with patch("argparse.ArgumentParser.parse_args", return_value=argparse.Namespace(interactive=False, prune=False, strict=False)):
                        assert audit_markers.main() == 1

        captured = capsys.readouterr()
        assert "(no candidates found)" in captured.out
