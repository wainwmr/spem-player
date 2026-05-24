"""Tests for build/postprocessSvg.py module integrity."""

import warnings
from pathlib import Path

MODULE_PATH = Path(__file__).parent.parent / "postprocessSvg.py"


def test_module_compiles_without_syntax_warning():
    """Verify postprocessSvg.py has no invalid escape sequences.

    Python 3.12+ emits SyntaxWarning for invalid escapes; Python 3.14+
    promotes this to SyntaxError. Treating SyntaxWarning as an error
    catches the problem on all affected versions.
    """
    source = MODULE_PATH.read_text(encoding="utf-8")
    with warnings.catch_warnings():
        warnings.filterwarnings("error", category=SyntaxWarning)
        compile(source, str(MODULE_PATH), "exec")
