"""Photographs the main screens on the emulator, against the local stack.

    python tool/screens.py [out-dir]

Same account as tool/e2e.py (E2E_EMAIL / E2E_PASSWORD from ../.env.local). The images are
written to build/screens/, then copied to out-dir if one is given.
"""
import pathlib
import re
import shutil
import subprocess
import sys

MOBILE = pathlib.Path(__file__).resolve().parents[1]
env = (MOBILE.parent / ".env.local").read_text(encoding="utf-8")
creds = {k: re.search(rf"^{k}=(.*)$", env, flags=re.M).group(1).strip()
         for k in ("E2E_EMAIL", "E2E_PASSWORD")}

# Same as tool/e2e.py: the tour asks for a reset code, so the LOCAL stack's anti-abuse counters
# for this account and the Docker gateway address are cleared first.
for pattern in ("rl:*:ip:172.*", f"*{creds['E2E_EMAIL']}*"):
    keys = subprocess.run(
        ["docker", "compose", "--env-file", ".env.local", "exec", "-T", "redis",
         "redis-cli", "--scan", "--pattern", pattern],
        cwd=MOBILE.parent, capture_output=True, text=True).stdout.split()
    if keys:
        subprocess.run(["docker", "compose", "--env-file", ".env.local", "exec", "-T", "redis",
                        "redis-cli", "DEL", *keys], cwd=MOBILE.parent, capture_output=True)

out = MOBILE / "build" / "screens"
shutil.rmtree(out, ignore_errors=True)
cmd = [
    "flutter", "drive", "--profile",
    "--driver=test_driver/screens_driver.dart",
    "--target=integration_test/screens_tour.dart",
    "--dart-define=API_BASE_URL=http://10.0.2.2:8088",
    *[f"--dart-define={k}={v}" for k, v in creds.items()],
]
code = subprocess.run(cmd, cwd=MOBILE, shell=True).returncode
if len(sys.argv) > 1 and out.exists():
    dest = pathlib.Path(sys.argv[1])
    shutil.rmtree(dest, ignore_errors=True)
    shutil.copytree(out, dest)
print("captures:", sorted(p.name for p in out.glob("*.png")) if out.exists() else "aucune")
sys.exit(code)
