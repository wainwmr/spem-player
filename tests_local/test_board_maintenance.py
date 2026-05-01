"""Tests for scripts/board_maintenance.py.

Uses unittest.mock to patch subprocess.run and simulate GraphQL responses.
"""

import argparse
import json
import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))

import board_maintenance


class TestFetchSchema:
    def test_parses_graphql_response(self):
        mock_response = {
            "data": {
                "node": {
                    "fields": {
                        "nodes": [
                            {
                                "name": "Status",
                                "options": [
                                    {"name": "Todo", "description": "", "color": "RED"},
                                    {"name": "Done", "description": "", "color": "GREEN"},
                                ],
                            },
                            {"name": "Assignees"},
                        ]
                    }
                }
            }
        }

        with patch("board_maintenance.subprocess.run") as mock_run:
            mock_run.return_value = MagicMock(
                returncode=0, stdout=json.dumps(mock_response), stderr=""
            )
            result = board_maintenance.fetch_schema()

        assert "Status" in result
        assert result["Status"]["options"]["Todo"]["color"] == "RED"
        assert "Assignees" in result
        assert result["Assignees"] == {}

    def test_raises_on_graphql_error(self):
        with patch("board_maintenance.subprocess.run") as mock_run:
            mock_run.return_value = MagicMock(
                returncode=1, stdout="", stderr="GraphQL error"
            )
            with pytest.raises(RuntimeError, match="Failed to fetch board schema"):
                board_maintenance.fetch_schema()


class TestDiffSchema:
    def test_no_changes(self):
        schema = {"Status": {"options": {"Todo": {"description": "", "color": "RED"}}}}
        assert board_maintenance.diff_schema(schema, schema) == []

    def test_field_added(self):
        current = {"Status": {}}
        baseline = {}
        assert board_maintenance.diff_schema(current, baseline) == ["+ Field added: Status"]

    def test_field_removed(self):
        current = {}
        baseline = {"Status": {}}
        assert board_maintenance.diff_schema(current, baseline) == ["- Field removed: Status"]

    def test_option_added(self):
        current = {"Status": {"options": {"Todo": {"description": "", "color": "RED"}}}}
        baseline = {"Status": {}}
        assert board_maintenance.diff_schema(current, baseline) == [
            "+ Option added: Status / Todo"
        ]

    def test_option_removed(self):
        current = {"Status": {}}
        baseline = {"Status": {"options": {"Todo": {"description": "", "color": "RED"}}}}
        assert board_maintenance.diff_schema(current, baseline) == [
            "- Option removed: Status / Todo"
        ]

    def test_description_changed(self):
        current = {"Status": {"options": {"Todo": {"description": "new", "color": "RED"}}}}
        baseline = {"Status": {"options": {"Todo": {"description": "old", "color": "RED"}}}}
        changes = board_maintenance.diff_schema(current, baseline)
        assert any("Description changed" in c for c in changes)

    def test_color_changed(self):
        current = {"Status": {"options": {"Todo": {"description": "", "color": "BLUE"}}}}
        baseline = {"Status": {"options": {"Todo": {"description": "", "color": "RED"}}}}
        changes = board_maintenance.diff_schema(current, baseline)
        assert any("Color changed" in c for c in changes)


class TestMain:
    def test_establishes_baseline_when_missing(self, tmp_path, monkeypatch):
        monkeypatch.setattr(
            board_maintenance, "BASELINE_PATH", tmp_path / "board_baseline.json"
        )
        mock_schema = {"Status": {"options": {"Todo": {"description": "", "color": "RED"}}}}

        with patch.object(board_maintenance, "fetch_schema", return_value=mock_schema):
            with patch("argparse.ArgumentParser.parse_args", return_value=argparse.Namespace(update_baseline=False)):
                assert board_maintenance.main() == 0

        assert (tmp_path / "board_baseline.json").exists()

    def test_reports_unchanged(self, tmp_path, monkeypatch, capsys):
        schema = {"Status": {"options": {"Todo": {"description": "", "color": "RED"}}}}
        baseline_path = tmp_path / "board_baseline.json"
        baseline_path.write_text(json.dumps(schema), encoding="utf-8")
        monkeypatch.setattr(board_maintenance, "BASELINE_PATH", baseline_path)

        with patch.object(board_maintenance, "fetch_schema", return_value=schema):
            with patch("argparse.ArgumentParser.parse_args", return_value=argparse.Namespace(update_baseline=False)):
                assert board_maintenance.main() == 0

        captured = capsys.readouterr()
        assert "unchanged" in captured.out.lower()

    def test_detects_changes(self, tmp_path, monkeypatch):
        baseline = {"Status": {"options": {"Todo": {"description": "", "color": "RED"}}}}
        baseline_path = tmp_path / "board_baseline.json"
        baseline_path.write_text(json.dumps(baseline), encoding="utf-8")
        monkeypatch.setattr(board_maintenance, "BASELINE_PATH", baseline_path)

        current = {"Status": {"options": {"Todo": {"description": "new", "color": "BLUE"}}}}
        with patch.object(board_maintenance, "fetch_schema", return_value=current):
            with patch("argparse.ArgumentParser.parse_args", return_value=argparse.Namespace(update_baseline=False)):
                assert board_maintenance.main() == 1

    def test_update_baseline_flag(self, tmp_path, monkeypatch):
        baseline = {"Status": {"options": {"Todo": {"description": "", "color": "RED"}}}}
        baseline_path = tmp_path / "board_baseline.json"
        baseline_path.write_text(json.dumps(baseline), encoding="utf-8")
        monkeypatch.setattr(board_maintenance, "BASELINE_PATH", baseline_path)

        current = {"Status": {"options": {"Todo": {"description": "new", "color": "BLUE"}}}}
        with patch.object(board_maintenance, "fetch_schema", return_value=current):
            with patch("argparse.ArgumentParser.parse_args", return_value=argparse.Namespace(update_baseline=True)):
                assert board_maintenance.main() == 0

        updated = json.loads(baseline_path.read_text(encoding="utf-8"))
        assert updated["Status"]["options"]["Todo"]["description"] == "new"
