"""Integration tests for build/buildScores.mjs.

These tests use a stub lilypond executable to avoid the ~40-second
per-score cost of real LilyPond compilation. The stub creates minimal
valid SVGs that postprocessSvg.py can handle.
"""

import os
import shutil
import subprocess
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).parent.parent.parent
BUILD_SCRIPT = REPO_ROOT / "build" / "buildScores.mjs"
SCORES_DIR = REPO_ROOT / "src" / "scores" / "Hugh Keyte"
FAKE_LILYPOND_LOG = REPO_ROOT / "temp" / "fake_lilypond_invocations.log"


@pytest.fixture
def fake_lilypond():
    """Create a fake lilypond executable and return its directory."""
    fake_dir = REPO_ROOT / "temp" / "fake_lilypond_bin"
    fake_dir.mkdir(parents=True, exist_ok=True)

    # Clear any previous log
    if FAKE_LILYPOND_LOG.exists():
        FAKE_LILYPOND_LOG.unlink()

    # Create a Python helper script and a batch file to invoke it
    helper = fake_dir / "_fake_lilypond.py"
    helper.write_text(
        'import sys, os\n'
        'args = sys.argv[1:]\n'
        'outdir = args[args.index("-o")+1] if "-o" in args else "."\n'
        'infile = args[-1]\n'
        'name = os.path.splitext(os.path.basename(infile))[0]\n'
        'os.makedirs(outdir, exist_ok=True)\n'
        'svg_path = os.path.join(outdir, name + ".svg")\n'
        'with open(svg_path, "w", encoding="utf-8") as f:\n'
        '    f.write("<?xml version=\\"1.0\\" encoding=\\"UTF-8\\"?>\\n")\n'
        '    f.write("<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 100 100\\"></svg>\\n")\n'
        f'log_file = r"{FAKE_LILYPOND_LOG}"\n'
        'with open(log_file, "a", encoding="utf-8") as f:\n'
        '    f.write(" ".join(args) + "\\n")\n',
        encoding="utf-8",
    )

    bat = fake_dir / "lilypond.bat"
    bat.write_text(
        f'@echo off\n'
        f'python "{helper}" %*\n',
        encoding="utf-8",
    )

    return fake_dir


@pytest.fixture
def env_with_fake_lilypond(fake_lilypond: Path):
    """Return an environment dict with fake lilypond on PATH."""
    env = os.environ.copy()
    env["PATH"] = str(fake_lilypond) + os.pathsep + env.get("PATH", "")
    return env


@pytest.fixture
def clean_scores():
    """Backup and restore the scores directory around a test."""
    backup = REPO_ROOT / "src" / "scores" / ".test_backup_Hugh_Keyte"
    if SCORES_DIR.exists():
        shutil.copytree(SCORES_DIR, backup, dirs_exist_ok=True)

    yield

    if backup.exists():
        shutil.rmtree(SCORES_DIR, ignore_errors=True)
        shutil.copytree(backup, SCORES_DIR, dirs_exist_ok=True)
        shutil.rmtree(backup)


class TestBuildScores:
    def test_builds_all_notations(self, env_with_fake_lilypond, clean_scores):
        """Running without args should build both early and modern notations."""
        if SCORES_DIR.exists():
            shutil.rmtree(SCORES_DIR)

        result = subprocess.run(
            ["node", str(BUILD_SCRIPT)],
            capture_output=True,
            text=True,
            encoding="utf-8",
            cwd=REPO_ROOT,
            env=env_with_fake_lilypond,
        )
        assert result.returncode == 0, f"stderr: {result.stderr}"

        early_svgs = list((SCORES_DIR / "early").glob("Choir *.svg"))
        modern_svgs = list((SCORES_DIR / "modern").glob("Choir *.svg"))

        assert len(early_svgs) == 8, f"Expected 8 early SVGs, found {len(early_svgs)}"
        assert len(modern_svgs) == 8, f"Expected 8 modern SVGs, found {len(modern_svgs)}"

    def test_caches_by_mtime(self, env_with_fake_lilypond, clean_scores):
        """Second run should skip files whose SVG is newer than .ly source."""
        if SCORES_DIR.exists():
            shutil.rmtree(SCORES_DIR)

        # Clear log before first run
        if FAKE_LILYPOND_LOG.exists():
            FAKE_LILYPOND_LOG.unlink()

        # First run
        result1 = subprocess.run(
            ["node", str(BUILD_SCRIPT)],
            capture_output=True,
            text=True,
            encoding="utf-8",
            cwd=REPO_ROOT,
            env=env_with_fake_lilypond,
        )
        assert result1.returncode == 0

        def count_score_invocations():
            if not FAKE_LILYPOND_LOG.exists():
                return 0
            text = FAKE_LILYPOND_LOG.read_text(encoding="utf-8").strip()
            if not text:
                return 0
            lines = text.splitlines()
            # Filter out the --version check used for availability verification
            return len([line for line in lines if "--version" not in line])

        invocation_count_after_first = count_score_invocations()

        # Second run
        result2 = subprocess.run(
            ["node", str(BUILD_SCRIPT)],
            capture_output=True,
            text=True,
            encoding="utf-8",
            cwd=REPO_ROOT,
            env=env_with_fake_lilypond,
        )
        assert result2.returncode == 0

        invocation_count_after_second = count_score_invocations()

        # No new score-build invocations on second run
        assert invocation_count_after_second == invocation_count_after_first, (
            f"Cache not working: lilypond invoked {invocation_count_after_second - invocation_count_after_first} "
            f"times on second run (total score invocations: {invocation_count_after_second})"
        )

    def test_fails_gracefully_without_lilypond(self):
        """Script should exit with clear error if lilypond is not on PATH."""
        env = os.environ.copy()
        env["PATH"] = ""

        result = subprocess.run(
            ["node", str(BUILD_SCRIPT)],
            capture_output=True,
            text=True,
            encoding="utf-8",
            cwd=REPO_ROOT,
            env=env,
        )

        assert result.returncode != 0, "Expected failure when lilypond is missing"
        output = (result.stdout + result.stderr).lower()
        assert "lilypond" in output, (
            f"Expected clear error message about missing lilypond. "
            f"Output: {result.stdout} {result.stderr}"
        )

    def test_does_not_build_oup(self, env_with_fake_lilypond, clean_scores):
        """Script should not generate OUP edition SVGs."""
        if SCORES_DIR.exists():
            shutil.rmtree(SCORES_DIR)

        # Also remove any pre-existing OUP scores so we can detect new ones
        oup_dir = REPO_ROOT / "src" / "scores" / "OUP"
        if oup_dir.exists():
            shutil.rmtree(oup_dir)

        # Clear log before run
        if FAKE_LILYPOND_LOG.exists():
            FAKE_LILYPOND_LOG.unlink()

        result = subprocess.run(
            ["node", str(BUILD_SCRIPT)],
            capture_output=True,
            text=True,
            encoding="utf-8",
            cwd=REPO_ROOT,
            env=env_with_fake_lilypond,
        )
        assert result.returncode == 0

        # Check that no lilypond invocations referenced OUP files
        if FAKE_LILYPOND_LOG.exists():
            invocations = FAKE_LILYPOND_LOG.read_text(encoding="utf-8").strip().splitlines()
            oup_invocations = [line for line in invocations if "OUP" in line]
            assert len(oup_invocations) == 0, (
                f"OUP files should not be built, found {len(oup_invocations)} invocations"
            )

        # Also verify no OUP SVGs were created
        if oup_dir.exists():
            oup_svgs = list(oup_dir.glob("**/*.svg"))
            assert len(oup_svgs) == 0, f"OUP SVGs should not be generated, found {len(oup_svgs)}"
