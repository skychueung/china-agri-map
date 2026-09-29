#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""数据完整性断言（V4 数据落地批次）。

用法（在 app/ 目录下）：
    python scripts/check-data-integrity.py

读取 src/data/ 下全部机构数据文件（含 src/data/research/ 分片），执行断言，
全部通过输出 PASS 清单，任一失败输出 FAIL 并以非零码退出。

V4 计数口径（实数核对）：高校 80、科研 557（48 存量 + 509 新增）、总计 637。
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
    'src/data/research/nationalAcademies.ts',
    'src/data/research/caasInstitutes.ts',
    'src/data/research/caasInstitutesV4.ts',
    'src/data/research/cafsInstitutes.ts',
    'src/data/research/cafInstitutes.ts',
    'src/data/research/catasInstitutes.ts',
    'src/data/research/provincialAcademies.ts',
    'src/data/research/provincialInstitutesNorth.ts',
    'src/data/research/provincialInstitutesNortheast.ts',
    'src/data/research/provincialInstitutesEast.ts',
    'src/data/research/provincialInstitutesCentralSouth.ts',
    'src/data/research/provincialInstitutesSouthwest.ts',
    'src/data/research/provincialInstitutesNorthwest.ts',
]

REGIONS = {'东北地区', '华北地区', '华东地区', '华中地区', '华南地区', '西南地区', '西北地区', '港澳台地区'}
WEBSITE_STATUS = {'verified', 'pending', 'unavailable'}
COORD_SYSTEMS = {'WGS84', 'GCJ02', 'BD09'}
EDU_LEVELS = {'bachelor', 'associate'}
EDU_TYPES = {'regular', 'vocational'}
RESEARCH_UNIT_TYPES = {'academy', 'institute', 'research_center', 'experimental_center', 'support_unit'}
# parentInstitutionName 指向数据集之外上级的白名单（这些记录无 parentInstitutionId）
EXTERNAL_PARENT_WHITELIST = {'中华人民共和国农业农村部', '农业农村部', '国家林业和草原局', '青海大学'}


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
        aliases_m = re.search(r"aliases: \[([^\]]*)\]", b)
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
            'parentId': g(r"parentInstitutionId: '([^']+)'"),
            'parentName': g(r"parentInstitutionName: '([^']+)'"),
            'researchUnitType': g(r"researchUnitType: '([^']+)'"),
            'aliases': re.findall(r"'([^']+)'", aliases_m.group(1)) if aliases_m else None,
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
    id_set = set(ids)
    name_by_id = {r['id']: r['name'] for r in rows}
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

    # ── V4 新增断言 ─────────────────────────────────────────────
    # 父院存在性：parentInstitutionId 必须在数据集内；（无 id 仅 name 的）须在白名单
    bad_parent_ref = []
    for r in rows:
        if r['parentId']:
            if r['parentId'] not in id_set:
                bad_parent_ref.append(f"{r['id']}→{r['parentId']}")
        elif r['parentName'] and r['parentName'] not in EXTERNAL_PARENT_WHITELIST:
            bad_parent_ref.append(f"{r['id']}→外部:{r['parentName']}")
    check('parent exists or whitelisted', bad_parent_ref)
    # parentInstitutionName 与父记录 name 一致
    check('parent name matches', [
        f"{r['id']}:{r['parentName']}!={name_by_id.get(r['parentId'])}"
        for r in rows
        if r['parentId'] and r['parentId'] in id_set and r['parentName'] != name_by_id[r['parentId']]
    ])
    # 无自引用
    check('no self reference', [r['id'] for r in rows if r['parentId'] == r['id']])
    # 无循环引用（沿 parentId 链走，遇环即记录）
    parent_of = {r['id']: r['parentId'] for r in rows if r['parentId']}
    cyclic = []
    for rid in parent_of:
        seen = set()
        cur = rid
        while cur in parent_of:
            if cur in seen:
                cyclic.append(rid)
                break
            seen.add(cur)
            cur = parent_of[cur]
    check('no cyclic reference', sorted(set(cyclic)))
    # researchUnitType 取值在枚举内
    check('researchUnitType enum', [
        f"{r['id']}:{r['researchUnitType']}" for r in rows
        if r['researchUnitType'] and r['researchUnitType'] not in RESEARCH_UNIT_TYPES
    ])
    # aliases 为字符串数组（解析得到即合法；此处断言元素非空）
    check('aliases string array', [
        r['id'] for r in rows
        if r['aliases'] is not None and any(not a.strip() for a in r['aliases'])
    ])

    unis = [r for r in rows if r['kind'] == 'university']
    research = [r for r in rows if r['kind'] != 'university']
    check('university count', [] if len(unis) == 80 else [f'universities={len(unis)} != 80'])
    check('research count', [] if len(research) == 557 else [f'research={len(research)} != 557'])
    check('total count', [] if len(rows) == 637 else [f'total={len(rows)} != 637'])

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
