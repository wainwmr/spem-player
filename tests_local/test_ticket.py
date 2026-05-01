"""Tests for scripts/ticket.py.

Uses unittest.mock to patch subprocess.run and simulate gh responses.
"""

import argparse
import json
import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))

import ticket


class TestFetchProjectFields:
    def test_parses_fields_and_options(self):
        mock_response = {
            "data": {
                "node": {
                    "fields": {
                        "nodes": [
                            {
                                "id": "field-status-id",
                                "name": "Status",
                                "options": [
                                    {"id": "opt-todo", "name": "Todo"},
                                    {"id": "opt-done", "name": "Done"},
                                ],
                            },
                            {
                                "id": "field-type-id",
                                "name": "Type",
                                "options": [
                                    {"id": "opt-bug", "name": "bug"},
                                ],
                            },
                            {"name": "Assignees"},  # no options
                        ]
                    }
                }
            }
        }

        with patch("ticket.subprocess.run") as mock_run:
            mock_run.return_value = MagicMock(
                returncode=0, stdout=json.dumps(mock_response), stderr=""
            )
            result = ticket.fetch_project_fields()

        assert "status" in result
        assert result["status"]["id"] == "field-status-id"
        assert result["status"]["options"]["Todo"] == "opt-todo"
        assert "type" in result
        assert "assignees" not in result  # skipped because no options

    def test_raises_on_graphql_error(self):
        with patch("ticket.subprocess.run") as mock_run:
            mock_run.return_value = MagicMock(
                returncode=1, stdout="", stderr="GraphQL error"
            )
            with pytest.raises(RuntimeError, match="Failed to fetch project fields"):
                ticket.fetch_project_fields()


class TestCreateIssue:
    def test_creates_issue_with_body_file(self):
        with patch("ticket.subprocess.run") as mock_run:
            mock_run.return_value = MagicMock(
                returncode=0, stdout="https://github.com/wainwmr/spem-player/issues/99\n", stderr=""
            )
            url = ticket.create_issue("Test title", "Test body")

        assert url == "https://github.com/wainwmr/spem-player/issues/99"
        call_args = mock_run.call_args[0][0]
        assert call_args[0:3] == ["gh", "issue", "create"]
        assert "--body-file" in call_args

        # tmp file should be cleaned up
        assert not Path("tmp_ticket_body.md").exists()


class TestAddToProject:
    def test_adds_issue_and_returns_item(self):
        mock_json = {"id": "proj-item-123", "content": {"number": 99}}

        with patch("ticket.subprocess.run") as mock_run:
            mock_run.return_value = MagicMock(
                returncode=0, stdout=json.dumps(mock_json), stderr=""
            )
            result = ticket.add_to_project("https://github.com/wainwmr/spem-player/issues/99")

        assert result["id"] == "proj-item-123"
        call_args = mock_run.call_args[0][0]
        assert call_args[0:3] == ["gh", "project", "item-add"]


class TestSetField:
    def test_calls_item_edit(self):
        with patch("ticket.subprocess.run") as mock_run:
            mock_run.return_value = MagicMock(returncode=0, stdout="", stderr="")
            ticket.set_field("item-id", "field-id", "option-id")

        call_args = mock_run.call_args[0][0]
        assert call_args[0:3] == ["gh", "project", "item-edit"]
        assert "--id" in call_args
        assert "--field-id" in call_args
        assert "--single-select-option-id" in call_args


class TestMain:
    def test_creates_ticket_with_defaults(self, capsys):
        def mock_fetch():
            return {
                "status": {"id": "f-status", "options": {"Todo": "opt-todo"}},
                "type": {"id": "f-type", "options": {"bug": "opt-bug"}},
                "area": {"id": "f-area", "options": {"UI": "opt-ui"}},
            }

        def mock_run(cmd, **kwargs):
            if cmd[0:3] == ["gh", "issue", "create"]:
                return MagicMock(returncode=0, stdout="https://github.com/wainwmr/spem-player/issues/99\n", stderr="")
            if cmd[0:3] == ["gh", "project", "item-add"]:
                return MagicMock(returncode=0, stdout='{"id": "item-99"}', stderr="")
            return MagicMock(returncode=0, stdout="", stderr="")

        with patch("ticket.fetch_project_fields", side_effect=mock_fetch):
            with patch("ticket.subprocess.run", side_effect=mock_run):
                with patch("argparse.ArgumentParser.parse_args", return_value=argparse.Namespace(
                    title="Test ticket", type=None, area=None, body=""
                )):
                    assert ticket.main() == 0

        captured = capsys.readouterr()
        assert "Creating issue: Test ticket" in captured.out
        assert "Setting status to Todo" in captured.out

    def test_creates_ticket_with_type_and_area(self, capsys):
        def mock_fetch():
            return {
                "status": {"id": "f-status", "options": {"Todo": "opt-todo"}},
                "type": {"id": "f-type", "options": {"bug": "opt-bug"}},
                "area": {"id": "f-area", "options": {"UI": "opt-ui"}},
            }

        def mock_run(cmd, **kwargs):
            if cmd[0:3] == ["gh", "issue", "create"]:
                return MagicMock(returncode=0, stdout="https://github.com/wainwmr/spem-player/issues/99\n", stderr="")
            if cmd[0:3] == ["gh", "project", "item-add"]:
                return MagicMock(returncode=0, stdout='{"id": "item-99"}', stderr="")
            return MagicMock(returncode=0, stdout="", stderr="")

        with patch("ticket.fetch_project_fields", side_effect=mock_fetch):
            with patch("ticket.subprocess.run", side_effect=mock_run):
                with patch("argparse.ArgumentParser.parse_args", return_value=argparse.Namespace(
                    title="Bug ticket", type="bug", area="UI", body="Something is broken"
                )):
                    assert ticket.main() == 0

        captured = capsys.readouterr()
        assert "Setting type to bug" in captured.out
        assert "Setting area to UI" in captured.out

    def test_warns_on_unknown_area(self, capsys):
        def mock_fetch():
            return {
                "status": {"id": "f-status", "options": {"Todo": "opt-todo"}},
                "type": {"id": "f-type", "options": {}},
                "area": {"id": "f-area", "options": {"UI": "opt-ui"}},
            }

        def mock_run(cmd, **kwargs):
            if cmd[0:3] == ["gh", "issue", "create"]:
                return MagicMock(returncode=0, stdout="https://github.com/wainwmr/spem-player/issues/99\n", stderr="")
            if cmd[0:3] == ["gh", "project", "item-add"]:
                return MagicMock(returncode=0, stdout='{"id": "item-99"}', stderr="")
            return MagicMock(returncode=0, stdout="", stderr="")

        with patch("ticket.fetch_project_fields", side_effect=mock_fetch):
            with patch("ticket.subprocess.run", side_effect=mock_run):
                with patch("argparse.ArgumentParser.parse_args", return_value=argparse.Namespace(
                    title="Ticket", type=None, area="Nonexistent", body=""
                )):
                    assert ticket.main() == 0

        captured = capsys.readouterr()
        assert "Warning: area 'Nonexistent' not found" in captured.out
