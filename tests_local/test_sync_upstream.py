"""Tests for scripts/sync_upstream.py.

Uses unittest.mock to patch subprocess.run and simulate git/gh responses.
"""

import argparse
import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))

import sync_upstream


class TestGetCurrentBranch:
    def test_returns_branch_name(self):
        with patch("sync_upstream.subprocess.run") as mock_run:
            mock_run.return_value = MagicMock(
                returncode=0, stdout="issue-109-canvas-padding\n", stderr=""
            )
            assert sync_upstream.get_current_branch() == "issue-109-canvas-padding"


class TestVerifyRemotes:
    def test_passes_when_both_remotes_present(self):
        with patch("sync_upstream.subprocess.run") as mock_run:
            mock_run.return_value = MagicMock(
                returncode=0,
                stdout="upstream\thttps://github.com/wainwmr/spem-player.git (fetch)\norigin\thttps://github.com/wainwright1000/spem-player.git (fetch)\n",
                stderr="",
            )
            sync_upstream.verify_remotes()

    def test_exits_when_upstream_missing(self):
        with patch("sync_upstream.subprocess.run") as mock_run:
            mock_run.return_value = MagicMock(
                returncode=0,
                stdout="origin\thttps://github.com/wainwright1000/spem-player.git (fetch)\n",
                stderr="",
            )
            with pytest.raises(SystemExit) as exc_info:
                sync_upstream.verify_remotes()
            assert exc_info.value.code == 1

    def test_exits_when_origin_missing(self):
        with patch("sync_upstream.subprocess.run") as mock_run:
            mock_run.return_value = MagicMock(
                returncode=0,
                stdout="upstream\thttps://github.com/wainwmr/spem-player.git (fetch)\n",
                stderr="",
            )
            with pytest.raises(SystemExit) as exc_info:
                sync_upstream.verify_remotes()
            assert exc_info.value.code == 1


class TestVerifyGhAuth:
    def test_passes_when_authenticated(self):
        with patch("sync_upstream.subprocess.run") as mock_run:
            mock_run.return_value = MagicMock(
                returncode=0, stdout="github.com\n", stderr=""
            )
            sync_upstream.verify_gh_auth()

    def test_exits_when_not_authenticated(self):
        with patch("sync_upstream.subprocess.run") as mock_run:
            mock_run.return_value = MagicMock(
                returncode=1, stdout="", stderr="not logged in"
            )
            with pytest.raises(SystemExit) as exc_info:
                sync_upstream.verify_gh_auth()
            assert exc_info.value.code == 1


class TestHasUncommittedChanges:
    def test_true_when_changes_exist(self):
        with patch("sync_upstream.subprocess.run") as mock_run:
            mock_run.return_value = MagicMock(
                returncode=0, stdout=" M src/ts/MusicCanvas.ts\n", stderr=""
            )
            assert sync_upstream.has_uncommitted_changes() is True

    def test_false_when_clean(self):
        with patch("sync_upstream.subprocess.run") as mock_run:
            mock_run.return_value = MagicMock(returncode=0, stdout="", stderr="")
            assert sync_upstream.has_uncommitted_changes() is False


class TestGetUncommittedFiles:
    def test_returns_file_list(self):
        with patch("sync_upstream.subprocess.run") as mock_run:
            mock_run.return_value = MagicMock(
                returncode=0,
                stdout=" M src/ts/MusicCanvas.ts\n?? tests_local/new.py\n",
                stderr="",
            )
            files = sync_upstream.get_uncommitted_files()
            assert len(files) == 2
            assert "MusicCanvas.ts" in files[0]


class TestReportMarkCommits:
    def test_prints_commits(self, capsys):
        with patch("sync_upstream.subprocess.run") as mock_run:
            mock_run.return_value = MagicMock(
                returncode=0,
                stdout="eaa05d1 fix: keep canvas pulse alive\n",
                stderr="",
            )
            sync_upstream.report_mark_commits("upstream/dev")
        captured = capsys.readouterr()
        assert "eaa05d1" in captured.out

    def test_prints_none_when_empty(self, capsys):
        with patch("sync_upstream.subprocess.run") as mock_run:
            mock_run.return_value = MagicMock(returncode=0, stdout="", stderr="")
            sync_upstream.report_mark_commits("upstream/dev")
        captured = capsys.readouterr()
        assert "No new commits" in captured.out


class TestReportBranchStatus:
    def test_up_to_date(self, capsys):
        with patch("sync_upstream.subprocess.run") as mock_run:
            mock_run.return_value = MagicMock(returncode=0, stdout="", stderr="")
            sync_upstream.report_branch_status("main")
        captured = capsys.readouterr()
        assert "up to date" in captured.out

    def test_ahead_and_behind(self, capsys):
        with patch("sync_upstream.subprocess.run") as mock_run:
            mock_run.return_value = MagicMock(
                returncode=0, stdout="<abc123\n>def456\n>ghi789\n", stderr=""
            )
            sync_upstream.report_branch_status("main")
        captured = capsys.readouterr()
        assert "2 ahead" in captured.out
        assert "1 behind" in captured.out


class TestMain:
    def test_clean_tree_successful_rebase_no_push(self):
        call_sequence = []

        def mock_run(cmd, **kwargs):
            call_sequence.append(cmd)
            stdout_map = {
                ("git", "branch", "--show-current"): "main\n",
                ("git", "status", "--porcelain"): "",
                ("git", "fetch", "upstream"): "",
                ("git", "fetch", "origin"): "",
                ("git", "log", "--oneline", "HEAD..upstream/dev"): "",
                ("git", "rev-list", "--left-right", "origin/main...main"): "",
                ("git", "rebase", "upstream/dev"): "",
            }
            key = tuple(cmd)
            return MagicMock(returncode=0, stdout=stdout_map.get(key, ""), stderr="")

        with patch("sync_upstream.subprocess.run", side_effect=mock_run):
            with patch("sync_upstream.verify_remotes"):
                with patch("sync_upstream.verify_gh_auth"):
                    with patch("argparse.ArgumentParser.parse_args", return_value=argparse.Namespace(push=False, base="upstream/dev")):
                        sync_upstream.main()

        assert any(c[0:2] == ["git", "fetch"] for c in call_sequence)
        assert any(c[0:2] == ["git", "rebase"] for c in call_sequence)

    def test_stashed_changes_skip_push_by_default(self):
        call_sequence = []

        def mock_run(cmd, **kwargs):
            call_sequence.append(cmd)
            stdout_map = {
                ("git", "branch", "--show-current"): "main\n",
                ("git", "status", "--porcelain"): " M file.txt\n",
                ("git", "fetch", "upstream"): "",
                ("git", "fetch", "origin"): "",
                ("git", "log", "--oneline", "HEAD..upstream/dev"): "",
                ("git", "rev-list", "--left-right", "origin/main...main"): "",
                ("git", "stash", "push"): "stash@{0}\n",
                ("git", "rebase", "upstream/dev"): "",
                ("git", "stash", "pop"): "",
            }
            key = tuple(cmd)
            return MagicMock(returncode=0, stdout=stdout_map.get(key, ""), stderr="")

        with patch("sync_upstream.subprocess.run", side_effect=mock_run):
            with patch("sync_upstream.verify_remotes"):
                with patch("sync_upstream.verify_gh_auth"):
                    with patch("argparse.ArgumentParser.parse_args", return_value=argparse.Namespace(push=False, base="upstream/dev")):
                        sync_upstream.main()

        push_calls = [c for c in call_sequence if c[0:2] == ["git", "push"]]
        assert len(push_calls) == 0, "Push should be skipped when changes were stashed"
        stash_pop_calls = [c for c in call_sequence if c[0:2] == ["git", "stash"]]
        assert len(stash_pop_calls) == 1

    def test_stashed_changes_push_with_force_flag(self):
        call_sequence = []

        def mock_run(cmd, **kwargs):
            call_sequence.append(cmd)
            stdout_map = {
                ("git", "branch", "--show-current"): "main\n",
                ("git", "status", "--porcelain"): " M file.txt\n",
                ("git", "fetch", "upstream"): "",
                ("git", "fetch", "origin"): "",
                ("git", "log", "--oneline", "HEAD..upstream/dev"): "",
                ("git", "rev-list", "--left-right", "origin/main...main"): "",
                ("git", "stash", "push"): "stash@{0}\n",
                ("git", "rebase", "upstream/dev"): "",
                ("git", "push", "origin", "main"): "",
                ("git", "stash", "pop"): "",
            }
            key = tuple(cmd)
            return MagicMock(returncode=0, stdout=stdout_map.get(key, ""), stderr="")

        with patch("sync_upstream.subprocess.run", side_effect=mock_run):
            with patch("sync_upstream.verify_remotes"):
                with patch("sync_upstream.verify_gh_auth"):
                    with patch("argparse.ArgumentParser.parse_args", return_value=argparse.Namespace(push=True, base="upstream/dev")):
                        sync_upstream.main()

        push_calls = [c for c in call_sequence if c[0:2] == ["git", "push"]]
        assert len(push_calls) == 1, "Push should happen with --push even when stash was used"

    def test_rebase_failure_exits_with_stash_intact(self):
        with patch("sync_upstream.verify_gh_auth"):
            with patch("sync_upstream.verify_remotes"):
                with patch.object(sync_upstream, "get_current_branch", return_value="main"):
                    with patch.object(sync_upstream, "has_uncommitted_changes", return_value=True):
                        with patch.object(sync_upstream, "get_uncommitted_files", return_value=[" M file.txt"]):
                            with patch("sync_upstream.subprocess.run") as mock_run:
                                def side_effect(cmd, **kwargs):
                                    if cmd[0:2] == ["git", "stash"]:
                                        return MagicMock(returncode=0, stdout="stash@{0}", stderr="")
                                    if cmd[0:2] == ["git", "rebase"]:
                                        return MagicMock(returncode=1, stdout="", stderr="conflict")
                                    return MagicMock(returncode=0, stdout="", stderr="")
                                mock_run.side_effect = side_effect
                                with patch("argparse.ArgumentParser.parse_args", return_value=argparse.Namespace(push=False, base="upstream/dev")):
                                    with pytest.raises(SystemExit) as exc_info:
                                        sync_upstream.main()
                                    assert exc_info.value.code == 1
