#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""数据完整性断言（V3 审计批次）。

用法（在 app/ 目录下）：
    python scripts/check-data-integrity.py

读取 src/data/ 下全部机构数据文件，执行 13 项断言，全部通过输出 PASS 清单，
任一失败输出 FAIL 并以非零码退出。
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_FILES = [
    'src/data/universities.ts',
    'src/data/universitiesBatch2026A.ts',
    'src/data/universitiesBatch2026B.ts',
    'src/data/universitiesBatch2026C.ts',
    'src/data/researchInstitutes.ts',
]

REGIONS = {'东北地区', '华北地区', '华东地区', '华中地区', '华南地区', '西南地区', '西北地区', '港澳台地区'}
WEBSITE_STATUS = {'verified', 'pending', 'unavailable'}
COORD_SYSTEMS = {'WGS84', 'GCJ02', 'BD09'}
EDU_LEVELS = {'bachelor', 'associate'}
EDU_TYPES = {'regular', 'vocational'}


def load_fields():
    src = (ROOT / 'src/data/researchFields.ts').read_text(encoding='utf-8')
    m = re.search(r'RESEARCH_FIELDS[^=]*=\s*\[(.*?)\];', src, re.S)
    return set(re.findall(r"'([^']+)'", m.group(1)))


def parse(path):
    src = path.read_text(encoding='utf-8')
    for b in re.findall(r"\{\s*\n\s*id:.*?\n\s*\},?", src, re.S):
        def g(pat, default=None):
            m = re.search(pat, b)
            return m.group(1) if m else default
        yield {
            'id': g(r"id: '([^']+)'"),
            'name': g(r"name: '([^']+)'"),
            'kind': g(r"institutionKind: '([^']+)'"),
            'region': g(r"region: '([^']+)'"),
            'province': g(r"province: '([^']+)'"),
            'city': g(r"city: '([^']+)'"),
            'website': g(r"website: '([^']+)'"),
            'websiteStatus': g(r"websiteStatus: '([^']+)'"),
            'lat': g(r"latitude: (-?[\d.]+|null)"),
            'lng': g(r"longitude: (-?[\d.]+|null)"),
            'fields': re.findall(r"'([^']+)'", g(r"researchFields: \[([^\]]*)\]", '') or ''),
            'description': 'yes' if re.search(r"description: '.{10,}", b) else None,
            'lastVerifiedAt': g(r"lastVerifiedAt: '([^']+)'"),
            'educationLevel': g(r"educationLevel: '([^']+)'"),
            'educationType': g(r"educationType: '([^']+)'"),
            'coordinateSystem': g(r"coordinateSystem: '([^']+)'"),
        }


def main():
    valid_fields = load_fields()
    rows = []
    for f in DATA_FILES:
        rows += list(parse(ROOT / f))

    results = []
    def check(label, problems):
        results.append((label, problems))

    ids = [r['id'] for r in rows]
    check('id unique', sorted({i for i in ids if ids.count(i) > 1}))
    names = [r['name'] for r in rows]
    check('name duplicate check', sorted({n for n in names if names.count(n) > 1}))
    check('URLs', [r['id'] for r in rows if r['website'] and not re.match(r'^https?://', r['website'])])
    check('websiteStatus enum', [r['id'] for r in rows if r['websiteStatus'] not in WEBSITE_STATUS])
    check('region enum', [r['id'] for r in rows if r['region'] not in REGIONS])
    check('fields controlled', [f"{r['id']}:{f}" for r in rows for f in r['fields'] if f not in valid_fields])
    bad_coord = []
    for r in rows:
        if r['lat'] in (None, 'null') or r['lng'] in (None, 'null'):
            continue
        la, lo = float(r['lat']), float(r['lng'])
        if not (-90 <= la <= 90 and -180 <= lo <= 180):
            bad_coord.append(r['id'])
    check('coordinates', bad_coord)
    check('coordinateSystem enum', [r['id'] for r in rows if r['coordinateSystem'] and r['coordinateSystem'] not in COORD_SYSTEMS])
    check('province non-empty', [r['id'] for r in rows if not r['province']])
    check('city non-empty', [r['id'] for r in rows if not r['city']])
    check('description non-empty', [r['id'] for r in rows if not r['description']])
    check('lastVerifiedAt format', [r['id'] for r in rows if r['lastVerifiedAt'] and not re.match(r'^\d{4}-\d{2}-\d{2}$', r['lastVerifiedAt'])])
    bad_edu = []
    for r in rows:
        if r['kind'] != 'university':
            continue
        if r['educationLevel'] not in EDU_LEVELS or r['educationType'] not in EDU_TYPES:
            bad_edu.append(r['id'])
    check('education types', bad_edu)

    unis = [r for r in rows if r['kind'] == 'university']
    research = [r for r in rows if r['kind'] != 'university']
    check('university count', [] if len(unis) == 80 else [f'universities={len(unis)} != 80'])
    check('research count', [] if len(research) == 48 else [f'research={len(research)} != 48'])
    check('total count', [] if len(rows) == 128 else [f'total={len(rows)} != 128'])

    failed = False
    for label, problems in results:
        if problems:
            failed = True
            print(f'FAIL {label}: {problems[:10]}')
        else:
            print(f'PASS {label}')
    sys.exit(1 if failed else 0)


if __name__ == '__main__':
    main()
