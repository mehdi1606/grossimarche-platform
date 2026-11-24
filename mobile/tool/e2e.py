"""Runs the end-to-end test on the emulator, against the local stack.

    python tool/e2e.py [--debug]

Reads the test account from ../.env.local (E2E_EMAIL / E2E_PASSWORD, git-ignored) and passes
it to the test as --dart-define values, so no credential is ever typed in a command or kept
in the repository. Runs in profile mode by default: that is release speed with measurement
attached, the only mode in which timings mean anything - a debug build is several times
slower by design.
"""
import json
import pathlib
import re
import subprocess
import sys

MOBILE = pathlib.Path(__file__).resolve().parents[1]
ENV = MOBILE.parent / ".env.local"

env = ENV.read_text(encoding="utf-8")
creds = {k: re.search(rf"^{k}=(.*)$", env, flags=re.M) for k in ("E2E_EMAIL", "E2E_PASSWORD")}
missing = [k for k, m in creds.items() if m is None]
if missing:
    sys.exit(f"Absent de .env.local : {', '.join(missing)}")

# Reset the LOCAL stack's anti-abuse counters this test trips by design: it signs in with a
# wrong password, asks for a reset code and registers a shop on every run, all from the same
# Docker gateway address. The limits are real and stay in force; without this, the third run
# of the day is refused "Trop de demandes" and tests nothing.
email = creds["E2E_EMAIL"].group(1).strip()
for pattern in ("rl:*:ip:172.*", f"*{email}*"):
    keys = subprocess.run(
        ["docker", "compose", "--env-file", ".env.local", "exec", "-T", "redis",
         "redis-cli", "--scan", "--pattern", pattern],
        cwd=MOBILE.parent, capture_output=True, text=True).stdout.split()
    if keys:
        subprocess.run(["docker", "compose", "--env-file", ".env.local", "exec", "-T", "redis",
                        "redis-cli", "DEL", *keys], cwd=MOBILE.parent, capture_output=True)

def psql(sql):
    subprocess.run(["docker", "compose", "--env-file", ".env.local", "exec", "-T", "postgres",
                    "psql", "-U", "grossimarche", "-d", "grossimarche", "-q", "-c", sql],
                   cwd=MOBILE.parent, capture_output=True, check=True)


# The promo code the test applies at checkout (5 %, LOCAL stack only). Switched back off after
# the run rather than deleted: the orders it was used on keep their redemption record.
psql("""
insert into coupons (id, code, type, value, per_user_limit, active)
values (gen_random_uuid(), 'E2EPROMO', 'PERCENTAGE', 5, 100000, true)
on conflict (code) do update set active = true, per_user_limit = 100000, usage_limit = null,
  min_order_subtotal = 0, starts_at = null, expires_at = null;""")

mode = "--debug" if "--debug" in sys.argv else "--profile"
cmd = [
    "flutter", "drive", mode,
    "--driver=test_driver/integration_test.dart",
    "--target=integration_test/app_flow_test.dart",
    "--dart-define=API_BASE_URL=http://10.0.2.2:8088",
    *[f"--dart-define={k}={m.group(1).strip()}" for k, m in creds.items()],
]
result = subprocess.run(cmd, cwd=MOBILE, shell=True)

# Each run applies for a shop account (step 3). Those applications have no orders and would
# otherwise pile up in the back office's approval queue, so they are removed. The order the
# run places is NOT removed: cancelling restores stock and loyalty points, which only the
# back office does correctly - cancel it there.
CLEANUP = """
begin;
create temp table t on commit drop as
  select id from users where email like 'e2e.signup.%@marketfood.test' and status='PENDING'
    and not exists (select 1 from orders o where o.user_id = users.id);
delete from device_tokens        where user_id in (select id from t);
delete from carts                where user_id in (select id from t);
delete from addresses            where user_id in (select id from t);
delete from loyalty_transactions where user_id in (select id from t);
delete from loyalty_accounts     where user_id in (select id from t);
delete from users                where id in (select id from t);
commit;"""
psql(CLEANUP)
# The review the run leaves (step 5) would otherwise wait in the back office's moderation queue.
psql(f"delete from product_reviews where user_id = (select id from users where email = '{email}');")
psql("update coupons set active = false where code = 'E2EPROMO';")

report = MOBILE / "build" / "integration_response_data.json"
if report.exists():
    data = json.loads(report.read_text(encoding="utf-8"))
    print("\n=== temps par etape (ms) ===")
    for step, ms in (data.get("etapes_ms") or {}).items():
        print(f"  {step:38s} {ms:>6}")
    frames = data.get("images") or {}
    if frames:
        print("\n=== images ===")
        for key, value in frames.items():
            print(f"  {key:38s} {value:>6}")
sys.exit(result.returncode)
