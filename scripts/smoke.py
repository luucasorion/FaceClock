"""Smoke test for FaceClock — the orchestrator's verify gate.

This is NOT a correctness test. It proves the FastAPI app still imports and wires
up: catches syntax errors, broken imports, bad route registration, and invalid
Pydantic/SQLAlchemy schemas — i.e. the ways an automated edit usually breaks things.

Exit 0 = app boots. Exit 1 = something is broken. Run: `python scripts/smoke.py`
"""
import os
import sys

# Run from anywhere: put the repo root (this file's parent's parent) on sys.path.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Quiet the TensorFlow/DeepFace startup noise so pass/fail is readable.
os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "3")
os.environ.setdefault("TF_ENABLE_ONEDNN_OPTS", "0")


def main() -> int:
    try:
        import main as app_module
    except Exception as exc:  # noqa: BLE001 - any import failure is a gate failure
        print(f"SMOKE FAIL: app import raised {type(exc).__name__}: {exc}")
        return 1

    routes = getattr(getattr(app_module, "app", None), "routes", [])
    if not routes:
        print("SMOKE FAIL: app imported but no routes registered")
        return 1

    print(f"SMOKE OK: {len(routes)} routes registered")
    return 0


if __name__ == "__main__":
    sys.exit(main())
