"""Exercise release coverage, CLI compatibility and failure handling without network."""

import os
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path
from validate_release import validate

SCRIPTS = Path(__file__).resolve().parent


class ReleaseTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        shutil.copytree(SCRIPTS, self.root / "scripts")
        self.data = self.root / "src/store/data/semester_data"
        self.data.mkdir(parents=True)
        self.bin = self.root / "bin"
        self.bin.mkdir()
        self.command("git", "echo snapshot")
        self.command("python", f'exec "{os.sys.executable}" "$@"')
        self.env = {
            **os.environ,
            "PATH": f"{self.bin}:{os.environ['PATH']}",
            "QUACS_DATA_SHA": "snapshot",
        }
        self.stub = self.root / "scripts/build_single.sh"
        self.stub.write_text('#!/bin/bash\necho "$@" >> calls\n')
        self.stub.chmod(0o755)

    def command(self, name, body):
        path = self.bin / name
        path.write_text(f"#!/bin/sh\n{body}\n")
        path.chmod(0o755)

    def run_build(self, *args):
        return subprocess.run(
            ["bash", "scripts/build_entry.sh", *args],
            cwd=self.root,
            env=self.env,
            capture_output=True,
            text=True,
        )

    def semesters(self, count):
        names = [f"{2000 + i}01" for i in range(count)]
        for name in names:
            (self.data / name).mkdir()
        return names

    def test_partitions_cover_every_semester_exactly_once(self):
        expected = self.semesters(90)
        for partition in range(6):
            result = self.run_build(
                "-b", "-a", "-p", str(partition), "-c", "6", "-o", f"out{partition}"
            )
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertEqual(
                (self.root / f"out{partition}/index.html").exists(), partition == 0
            )
        calls = (self.root / "calls").read_text().splitlines()
        self.assertEqual(sorted(line.split()[-1] for line in calls), expected)
        self.assertTrue(all(line.startswith("-b -o out") for line in calls))

    def test_debug_all_build_does_not_skip_shared_data(self):
        self.semesters(3)
        result = self.run_build("-d", "-b", "-a")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(len((self.root / "calls").read_text().splitlines()), 3)

    def test_testing_semester_and_output_are_forwarded(self):
        self.semesters(1)
        result = self.run_build("-d", "-t", "-o", "custom")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(
            (self.root / "calls").read_text().strip(), "-d -o custom -s 202105"
        )

    def test_invalid_partition_rejected(self):
        self.semesters(1)
        self.assertNotEqual(self.run_build("-a", "-p", "6", "-c", "6").returncode, 0)

    def test_wrong_snapshot_rejected(self):
        self.env["QUACS_DATA_SHA"] = "wrong"
        self.assertNotEqual(self.run_build("-a").returncode, 0)

    def test_failed_build_stops_batch(self):
        self.semesters(3)
        self.stub.write_text("#!/bin/bash\nexit 9\n")
        self.assertNotEqual(self.run_build("-b", "-a").returncode, 0)
        self.assertFalse((self.root / "site/index.html").exists())

    def test_failed_wasm_cannot_publish_stale_bundle(self):
        self.semesters(1)
        (self.data / "200001/data.rs").write_text("// data")
        (self.root / "src/quacs-rs").mkdir()
        shutil.copy(SCRIPTS / "build_single.sh", self.stub)
        self.command("wasm-pack", "exit 9")
        self.command("vue-cli-service", "touch vue-ran")
        result = subprocess.run(
            ["bash", str(self.stub), "-b", "-s", "200001"],
            cwd=self.root,
            env=self.env,
            capture_output=True,
            text=True,
        )
        self.assertNotEqual(result.returncode, 0)
        self.assertFalse((self.root / "vue-ran").exists())

    def test_missing_semester_blocks_publication(self):
        self.semesters(1)
        output = self.root / "release"
        (output / "spring2000").mkdir(parents=True)
        (output / "index.html").write_text("redirect")
        (output / "spring2000/index.html").write_text("app")
        with self.assertRaises(ValueError):
            validate(self.data, output)
        (output / "spring2000/app.wasm").write_bytes(b"wasm")
        validate(self.data, output)


if __name__ == "__main__":
    unittest.main()
