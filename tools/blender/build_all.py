# Rebuilds the Blender models: `python3 tools/blender/build_all.py [--all] [-j N] [names...]`.
# Every model script (farmhouse.py, core.py, ...) lists its models with `--list`. Each model is
# built in its own process (Blender state is global), a few at a time. By default only models
# whose .glb is missing or older than their script are rebuilt; after changing the shared
# kit.py or common.py pass `--all` to rebuild everything, and names pick models directly. The run stops with an error if any model
# fails, so a broken model never slips into public/models silently.
import glob
import os
import subprocess
import sys
import time
from concurrent.futures import ThreadPoolExecutor

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', '..', 'public', 'models')
LIBS = ('common.py', 'kit.py')
SKIP = set(LIBS) | {'build_all.py'}
PINNED = {'farmhouse'}   # finished models, rebuilt only when named

args = sys.argv[1:]
jobs = int(args[args.index('-j') + 1]) if '-j' in args else 2
names = [a for i, a in enumerate(args) if not a.startswith('-') and (i == 0 or args[i - 1] != '-j')]

work = []
for path in sorted(glob.glob(os.path.join(HERE, '*.py'))):
    if os.path.basename(path) in SKIP:
        continue
    r = subprocess.run([sys.executable, path, '--list'], capture_output=True, text=True)
    models = r.stdout.split() if r.returncode == 0 and r.stdout.strip() else [os.path.basename(path)[:-3]]
    newest = os.path.getmtime(path)
    for m in models:
        glb = os.path.join(OUT, f'{m}.glb')
        stale = not os.path.exists(glb) or os.path.getmtime(glb) < newest
        if (m in names) if names else (m not in PINNED and ('--all' in args or stale)):
            work.append((path, m))


def build(item):
    path, m = item
    t = time.time()
    r = subprocess.run([sys.executable, path, m], capture_output=True, text=True)
    ok = r.returncode == 0 and 'done' in r.stdout and m in r.stdout
    print(f"{'ok  ' if ok else 'FAIL'} {m} ({time.time() - t:.0f}s)", flush=True)
    if not ok:
        print(r.stdout[-2000:], r.stderr[-2000:])
    return ok


if not work:
    print('all models are up to date')
with ThreadPoolExecutor(jobs) as pool:
    results = list(pool.map(build, work))
failed = [m for (_, m), ok in zip(work, results) if not ok]
if failed:
    sys.exit(f'failed: {", ".join(failed)}')
