"""Tests for scripts/cleanup_duplicates.py.

Uses unittest.mock to patch subprocess.run and simulate gh responses.
"""

import argparse
import json
import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))

import cleanup_duplicates


class TestNormaliseTitle:
    def test_strips_todo_prefix(self):
        assert cleanup_duplicates.normalise_title("TODO: Fix the thing") == "Fix the thing"

    def test_strips_bug_prefix_with_dot(self):
        assert cleanup_duplicates.normalise_title("BUG. Canvas drift") == "Canvas drift"

    def test_strips_hack_prefix(self):
        assert cleanup_duplicates.normalise_title("HACK: workaround") == "workaround"

    def test_strips_build_prefix(self):
        assert cleanup_duplicates.normalise_title("build: update CI") == "update CI"

    def test_cleans_whitespace(self):
        assert cleanup_duplicates.normalise_title("  Too   much   space  ") == "Too much space"

    def test_strips_backticks(self):
        assert cleanup_duplicates.normalise_title("`quoted title`") == "quoted title"

    def test_case_insensitive_prefix(self):
        assert cleanup_duplicates.normalise_title("todo lowercase") == "lowercase"


class TestFetchBoardItems:
    def test_parses_items(self):
        mock_response = {
            "items": [
                {"id": "item-1", "title": "First issue"},
                {"id": "item-2", "title": "Second issue"},
            ]
        }

        with patch("cleanup_duplicates.subprocess.run") as mock_run:
            mock_run.return_value = MagicMock(
                returncode=0, stdout=json.dumps(mock_response), stderr=""
            )
            items = cleanup_duplicates.fetch_board_items()

        assert len(items) == 2
        assert items[0]["title"] == "First issue"

    def test_raises_on_error(self):
        with patch("cleanup_duplicates.subprocess.run") as mock_run:
            mock_run.return_value = MagicMock(
                returncode=1, stdout="", stderr="API error"
            )
            with pytest.raises(RuntimeError, match="Failed to fetch board items"):
                cleanup_duplicates.fetch_board_items()


class TestRemoveFromBoard:
    def test_calls_item_delete(self):
        with patch("cleanup_duplicates.subprocess.run") as mock_run:
            mock_run.return_value = MagicMock(returncode=0, stdout="", stderr="")
            cleanup_duplicates.remove_from_board("item-id-123")

        call_args = mock_run.call_args[0][0]
        assert call_args[0:3] == ["gh", "project", "item-delete"]
        assert "--id" in call_args
        assert "item-id-123" in call_args


class TestMain:
    def test_no_items(self, capsys):
        with patch("cleanup_duplicates.fetch_board_items", return_value=[]):
            with patch("argparse.ArgumentParser.parse_args", return_value=argparse.Namespace(confirm=False)):
                assert cleanup_duplicates.main() == 0

        captured = capsys.readouterr()
        assert "No items found" in captured.out

    def test_no_duplicates(self, capsys):
        items = [
            {"id": "i1", "title": "Unique one", "content": {"number": 1}, "status": "Todo"},
            {"id": "i2", "title": "Unique two", "content": {"number": 2}, "status": "Todo"},
        ]

        with patch("cleanup_duplicates.fetch_board_items", return_value=items):
            with patch("argparse.ArgumentParser.parse_args", return_value=argparse.Namespace(confirm=False)):
                assert cleanup_duplicates.main() == 0

        captured = capsys.readouterr()
        assert "No duplicate tickets found" in captured.out

    def test_safe_duplicate_in_todo(self, capsys):
        """Duplicate in Todo with no assignees/PRs is safe to remove."""
        items = [
            {
                "id": "i1", "title": "Same title",
                "content": {"number": 10}, "status": "In Progress",
                "assignees": [], "linked_pull_requests": [],
            },
            {
                "id": "i2", "title": "Same title",
                "content": {"number": 20}, "status": "Todo",
                "assignees": [], "linked_pull_requests": [],
            },
        ]

        with patch("cleanup_duplicates.fetch_board_items", return_value=items):
            with patch("argparse.ArgumentParser.parse_args", return_value=argparse.Namespace(confirm=False)):
                assert cleanup_duplicates.main() == 0

        captured = capsys.readouterr()
        assert "1 ticket(s) to remove" in captured.out
        assert "0 to review manually" in captured.out
        assert "Dry run complete" in captured.out

    def test_unsafe_duplicate_has_assignees(self, capsys):
        """Duplicate with assignees must be reviewed manually."""
        items = [
            {
                "id": "i1", "title": "Same title",
                "content": {"number": 10}, "status": "Todo",
                "assignees": [], "linked_pull_requests": [],
            },
            {
                "id": "i2", "title": "Same title",
                "content": {"number": 20}, "status": "Todo",
                "assignees": ["someone"], "linked_pull_requests": [],
            },
        ]

        with patch("cleanup_duplicates.fetch_board_items", return_value=items):
            with patch("argparse.ArgumentParser.parse_args", return_value=argparse.Namespace(confirm=False)):
                assert cleanup_duplicates.main() == 0

        captured = capsys.readouterr()
        assert "0 ticket(s) to remove" in captured.out
        assert "1 to review manually" in captured.out
        assert "WARNING: assigned to someone" in captured.out

    def test_unsafe_duplicate_linked_prs(self, capsys):
        """Duplicate with linked PRs must be reviewed manually."""
        items = [
            {
                "id": "i1", "title": "Same title",
                "content": {"number": 10}, "status": "Todo",
                "assignees": [], "linked_pull_requests": [],
            },
            {
                "id": "i2", "title": "Same title",
                "content": {"number": 20}, "status": "Todo",
                "assignees": [], "linked_pull_requests": [{"url": "..."}],
            },
        ]

        with patch("cleanup_duplicates.fetch_board_items", return_value=items):
            with patch("argparse.ArgumentParser.parse_args", return_value=argparse.Namespace(confirm=False)):
                assert cleanup_duplicates.main() == 0

        captured = capsys.readouterr()
        assert "0 ticket(s) to remove" in captured.out
        assert "1 to review manually" in captured.out
        assert "WARNING: linked PRs present" in captured.out

    def test_unsafe_duplicate_advanced_status(self, capsys):
        """Duplicate with more advanced status than original must be reviewed."""
        items = [
            {
                "id": "i1", "title": "Same title",
                "content": {"number": 10}, "status": "Todo",
                "assignees": [], "linked_pull_requests": [],
            },
            {
                "id": "i2", "title": "Same title",
                "content": {"number": 20}, "status": "In Progress",
                "assignees": [], "linked_pull_requests": [],
            },
        ]

        with patch("cleanup_duplicates.fetch_board_items", return_value=items):
            with patch("argparse.ArgumentParser.parse_args", return_value=argparse.Namespace(confirm=False)):
                assert cleanup_duplicates.main() == 0

        captured = capsys.readouterr()
        assert "0 ticket(s) to remove" in captured.out
        assert "1 to review manually" in captured.out
        assert "WARNING: duplicate has more advanced status than original" in captured.out

    def test_confirm_removes_safe_duplicates(self, capsys):
        items = [
            {
                "id": "i1", "title": "Same title",
                "content": {"number": 10}, "status": "In Progress",
                "assignees": [], "linked_pull_requests": [],
            },
            {
                "id": "i2", "title": "Same title",
                "content": {"number": 20}, "status": "Todo",
                "assignees": [], "linked_pull_requests": [],
            },
        ]

        with patch("cleanup_duplicates.fetch_board_items", return_value=items):
            with patch("cleanup_duplicates.remove_from_board") as mock_remove:
                with patch("argparse.ArgumentParser.parse_args", return_value=argparse.Namespace(confirm=True)):
                    assert cleanup_duplicates.main() == 0

        mock_remove.assert_called_once_with("i2")
        captured = capsys.readouterr()
        assert "Removed ticket #20" in captured.out

    def test_confirm_blocked_by_unsafe_items(self, capsys):
        items = [
            {
                "id": "i1", "title": "Same title",
                "content": {"number": 10}, "status": "Todo",
                "assignees": [], "linked_pull_requests": [],
            },
            {
                "id": "i2", "title": "Same title",
                "content": {"number": 20}, "status": "Todo",
                "assignees": ["someone"], "linked_pull_requests": [],
            },
        ]

        with patch("cleanup_duplicates.fetch_board_items", return_value=items):
            with patch("cleanup_duplicates.remove_from_board") as mock_remove:
                with patch("argparse.ArgumentParser.parse_args", return_value=argparse.Namespace(confirm=True)):
                    assert cleanup_duplicates.main() == 1

        mock_remove.assert_not_called()
        captured = capsys.readouterr()
        assert "Review the list above before re-running" in captured.out

    def test_normalises_titles_before_grouping(self, capsys):
        """Titles that differ only by prefix or whitespace should group together."""
        items = [
            {
                "id": "i1", "title": "TODO: Fix bug",
                "content": {"number": 10}, "status": "In Progress",
                "assignees": [], "linked_pull_requests": [],
            },
            {
                "id": "i2", "title": "BUG. Fix bug",
                "content": {"number": 20}, "status": "Todo",
                "assignees": [], "linked_pull_requests": [],
            },
        ]

        with patch("cleanup_duplicates.fetch_board_items", return_value=items):
            with patch("argparse.ArgumentParser.parse_args", return_value=argparse.Namespace(confirm=False)):
                assert cleanup_duplicates.main() == 0

        captured = capsys.readouterr()
        assert "1 ticket(s) to remove" in captured.out
