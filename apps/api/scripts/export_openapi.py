"""Export the API contract without requiring a running database or real secrets."""

import json
import os
import sys
from pathlib import Path

root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(root))
os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://openapi:openapi@localhost/openapi")
os.environ.setdefault("JWT_SECRET", "openapi-generation-only-no-real-secret")

from app.main import app  # noqa: E402

(root / "openapi.json").write_text(json.dumps(app.openapi(), ensure_ascii=False, indent=2) + "\n")
