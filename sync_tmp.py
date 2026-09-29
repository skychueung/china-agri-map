import os, json, time, base64, subprocess, urllib.request

TOKEN = os.environ["GH_TOKEN"]
REPO = "skychueung/china-agri-map"
API = f"https://api.github.com/repos/{REPO}"
ROOT = os.path.dirname(os.path.abspath(__file__))
MSG = "V4: research system audit — 509 new institutes, schema split, docs governance"

def req(method, url, data=None, tries=3, allow404=False):
    body = json.dumps(data).encode() if data is not None else None
    for i in range(tries):
        try:
            r = urllib.request.Request(url, data=body, method=method, headers={
                "Authorization": f"token {TOKEN}",
                "Accept": "application/vnd.github+json",
                "Content-Type": "application/json",
                "User-Agent": "sync-script",
            })
            with urllib.request.urlopen(r, timeout=60) as resp:
                raw = resp.read().decode()
                return resp.status, (json.loads(raw) if raw else {})
        except urllib.error.HTTPError as e:
            if e.code == 404 and allow404:
                return 404, None
            print(f"  retry {i+1}/{tries} {method} {url}: {e}", flush=True)
            if i == tries - 1: raise
            time.sleep(5)
        except Exception as e:
            print(f"  retry {i+1}/{tries} {method} {url}: {e}", flush=True)
            if i == tries - 1: raise
            time.sleep(5)

DONE = {"KNOWN_ISSUES.md","README.md","WEBSITE_VERIFICATION.md","scripts/generate-verification-table.py","src/App.tsx","src/components/AboutSection.tsx","src/components/ChinaInstitutionMap.tsx","src/components/InstitutionFilters.tsx","src/components/InstitutionHierarchy.tsx","src/components/InstitutionTypeTabs.tsx","src/components/ResearchInstituteCard.tsx","src/components/StatisticsSection.tsx","src/components/UniversityCard.tsx","src/data/agriculturalInstitutions.ts","src/data/universities.ts","src/hooks/useInstitutionFilters.ts","src/types/institution.ts","src/utils/institutionFilters.ts","src/utils/mapPointStyle.ts","DATA_SCOPE.md","RESEARCH_INSTITUTE_AUDIT_2026.md","RESEARCH_INSTITUTE_BACKLOG.md","UNIVERSITY_AUDIT_2026.md"}
out = subprocess.run(["git", "status", "--porcelain"], cwd=ROOT, capture_output=True, text=True).stdout
upserts, deletes = [], []
for line in out.splitlines():
    code, path = line[:2].strip(), line[3:].strip().strip('"')
    if path in DONE:
        continue
    if code == "D":
        deletes.append(path)
    elif os.path.isdir(os.path.join(ROOT, path)):
        for root, _, names in os.walk(os.path.join(ROOT, path)):
            for n in names:
                p = os.path.relpath(os.path.join(root, n), ROOT).replace(os.sep, "/")
                if p not in DONE:
                    upserts.append(p)
    else:
        upserts.append(path)
print(f"upserts={len(upserts)} deletes={len(deletes)}", flush=True)

ok = 0
for path in upserts:
    with open(os.path.join(ROOT, path), "rb") as f:
        content = base64.b64encode(f.read()).decode()
    status, existing = req("GET", f"{API}/contents/{path}?ref=main", allow404=True)
    payload = {"message": MSG, "content": content, "branch": "main"}
    if status != 404 and existing and "sha" in existing:
        payload["sha"] = existing["sha"]
    req("PUT", f"{API}/contents/{path}", payload)
    ok += 1
    print(f"  PUT {ok}/{len(upserts)} {path}", flush=True)

for path in deletes:
    status, existing = req("GET", f"{API}/contents/{path}?ref=main", allow404=True)
    if status == 404:
        print(f"  DELETE skip (not on remote) {path}", flush=True)
        continue
    req("DELETE", f"{API}/contents/{path}", {"message": MSG, "sha": existing["sha"], "branch": "main"})
    print(f"  DELETE {path}", flush=True)

print(f"SYNC_OK upserted={ok} deleted={len(deletes)}", flush=True)
