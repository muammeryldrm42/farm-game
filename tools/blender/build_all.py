# Rebuilds every Blender model in one go: `python3 tools/blender/build_all.py`.
# Each model script runs in its own process (Blender state is global), and the run stops with
# an error if any model fails, so a broken model never slips into public/models silently.
import glob
import os
import subprocess
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
SKIP = {'common.py', 'build_all.py'}
scripts = sorted(p for p in glob.glob(os.path.join(HERE, '*.py')) if os.path.basename(p) not in SKIP)
failed = []
for path in scripts:
    name = os.path.basename(path)
    t = time.time()
    r = subprocess.run([sys.executable, path], capture_output=True, text=True)
    ok = r.returncode == 0 and 'done' in r.stdout
    print(f"{'ok  ' if ok else 'FAIL'} {name} ({time.time() - t:.0f}s)")
    if not ok:
        failed.append(name)
        print(r.stdout[-2000:], r.stderr[-2000:])
if failed:
    sys.exit(f'failed: {", ".join(failed)}')
