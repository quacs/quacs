"""Refuse publication if any expected semester or compiled WASM is absent."""

import sys
from pathlib import Path


def validate(data, output):
    terms = {"01": "spring", "05": "summer", "09": "fall", "12": "winter-enrichment"}
    semesters = sorted(p.name for p in data.iterdir() if p.is_dir())
    if not semesters or not (output / "index.html").is_file():
        raise ValueError("Missing semester data or root redirect")
    for semester in semesters:
        name = terms.get(semester[4:], semester[4:]) + semester[:4]
        directory = output / name
        if not (directory / "index.html").is_file() or not any(
            directory.rglob("*.wasm")
        ):
            raise ValueError(f"Incomplete semester: {name}")
    print(f"Validated {len(semesters)} semester bundles")


if __name__ == "__main__":
    validate(Path(sys.argv[1]), Path(sys.argv[2]))
