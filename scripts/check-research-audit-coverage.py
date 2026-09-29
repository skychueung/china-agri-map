#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""科研审计覆盖断言（V4）。

用法（在 app/ 目录下）：
    python scripts/check-research-audit-coverage.py

断言：
  1. 4 个国家级总院（caas / catas / chinese-academy-of-fishery-sciences /
     chinese-academy-of-forestry）均有审核记录（audit/n1~n4），
     且每份文件的 counts 与 units 实际分类计数一致；
  2. audit/parents.json 中 level=provincial 的全部 30 个省级农科院
     均在 audit/p1~p6 中有审核记录，且 counts 与 units 一致。

输出：PASS 4/4（国家级）、PASS 30/30（省级）及每院 include/review/exclude 计数表。
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
AUDIT = ROOT / 'audit'

NATIONAL_FILES = {
    'n1-caas.json': 'caas',
    'n4-catas.json': 'catas',
    'n2-cafs.json': 'chinese-academy-of-fishery-sciences',
    'n3-caf.json': 'chinese-academy-of-forestry',
}
PROVINCIAL_FILES = ['p1-huabei.json', 'p2-dongbei.json', 'p3-huadong.json',
                    'p4-huazhong.json', 'p5-huanan.json', 'p6-xibu.json']

# audit academyId（约定值）→ parents.json 权威 id（与 build-research-data.py 一致）
PARENT_ID_ALIAS = {
    'hebei-academy-of-agriculture-and-forestry-sciences': 'hebei-academy-of-agriculture-forestry-sciences',
    'shanxi-academy-of-agricultural-sciences': 'shanxi-academy-agricultural-sciences',
    'inner-mongolia-academy-of-agricultural-and-animal-husbandry-sciences': 'inner-mongolia-aaahs',
    'fujian-academy-of-agricultural-sciences': 'fujian-academy-agricultural-sciences',
    'jiangxi-academy-of-agricultural-sciences': 'jiangxi-academy-agricultural-sciences',
    'shandong-academy-of-agricultural-sciences': 'shandong-academy-agricultural-sciences',
    'hunan-academy-of-agricultural-sciences': 'hunan-aas',
    'yunnan-academy-of-agricultural-sciences': 'yunnan-academy-agricultural-sciences',
    'tibet-academy-of-agricultural-and-animal-husbandry-sciences': 'tibet-aaahs',
    'qinghai-academy-of-agriculture-and-forestry-sciences': 'qinghai-academy-agri-forestry-sciences',
}


def count_units(units):
    c = {'include': 0, 'review': 0, 'exclude': 0}
    for u in units:
        c[u['classification']] = c.get(u['classification'], 0) + 1
    return c


def counts_match(declared, actual):
    """counts 字段与 units 实际计数一致（declared 键名容忍 include/review/exclude 子集）。"""
    if not declared:
        return True
    for k, v in declared.items():
        if k in actual and actual[k] != v:
            return False
    return True


def main():
    failures = []
    rows = []

    # ── 国家级 4 院 ─────────────────────────────────────────────
    national_ok = 0
    for fn, expect_id in NATIONAL_FILES.items():
        path = AUDIT / fn
        if not path.exists():
            failures.append(f'缺少审计文件 {fn}')
            continue
        d = json.load(open(path, encoding='utf-8'))
        actual = count_units(d['units'])
        ok = d['academyId'] == expect_id and counts_match(d.get('counts'), actual)
        if ok:
            national_ok += 1
        else:
            failures.append(
                f"{fn}: academyId={d['academyId']}（期望 {expect_id}）或 counts 不一致 "
                f"declared={d.get('counts')} actual={actual}")
        rows.append((d['academy'], actual))

    # ── 省级 30 院 ─────────────────────────────────────────────
    parents = json.load(open(AUDIT / 'parents.json', encoding='utf-8'))
    provincial_parents = [p for p in parents if p['level'] == 'provincial']
    audited = {}
    for fn in PROVINCIAL_FILES:
        d = json.load(open(AUDIT / fn, encoding='utf-8'))
        for a in d['academies']:
            canon = PARENT_ID_ALIAS.get(a['academyId'], a['academyId'])
            audited[canon] = a

    provincial_ok = 0
    for p in provincial_parents:
        a = audited.get(p['id'])
        if a is None:
            failures.append(f"省级农科院缺审核记录：{p['name']}（{p['id']}）")
            rows.append((p['name'], None))
            continue
        actual = count_units(a['units'])
        if counts_match(a.get('counts'), actual):
            provincial_ok += 1
        else:
            failures.append(
                f"{p['name']}: counts 不一致 declared={a.get('counts')} actual={actual}")
        rows.append((a['academy'], actual))

    # ── 输出 ───────────────────────────────────────────────────
    print(f"{'总院':<28} {'include':>8} {'review':>7} {'exclude':>8}")
    print('-' * 56)
    for name, c in rows:
        if c is None:
            print(f'{name:<28} {"—":>8} {"—":>7} {"—":>8}')
        else:
            print(f"{name:<28} {c['include']:>8} {c['review']:>7} {c['exclude']:>8}")
    print('-' * 56)
    inc = sum(c['include'] for _, c in rows if c)
    rev = sum(c['review'] for _, c in rows if c)
    exc = sum(c['exclude'] for _, c in rows if c)
    print(f'{"合计":<28} {inc:>8} {rev:>7} {exc:>8}')

    label_n = f"国家级总院覆盖 {national_ok}/4"
    label_p = f"省级农科院覆盖 {provincial_ok}/30"
    if national_ok == 4:
        print(f'PASS {label_n}')
    else:
        print(f'FAIL {label_n}')
    if provincial_ok == 30:
        print(f'PASS {label_p}')
    else:
        print(f'FAIL {label_p}')
    for f in failures:
        print(f'  FAIL 明细: {f}')
    sys.exit(0 if (national_ok == 4 and provincial_ok == 30) else 1)


if __name__ == '__main__':
    main()
