#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""从数据文件生成官网核实状态表（WEBSITE_VERIFICATION.md 的表格部分）。

用法（在 app/ 目录下）：
    python scripts/generate-verification-table.py

输出：app/verification-table.md（Markdown 表格，含表头共 74 行，72 个机构）。
核实日期统一取脚本内 VERIFY_DATE 常量；如需更新核实日期，改常量后重跑即可。
数据源：src/data/universities*.ts、src/data/research/ 各分片（仅读取，不修改）。
"""
import re
from pathlib import Path

VERIFY_DATE = '2026-07-19'
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

KIND_LABEL = {
    'university': '农业院校',
    'research_academy': '科研总院',
    'research_institute': '专业研究所',
}
LEVEL_LABEL = {
    'national': '国家级',
    'provincial': '省级',
    'municipal': '地市级',
    'regional': '区域性',
}
STATUS_LABEL = {
    'verified': '已核实',
    'pending': '待核实',
    'unavailable': '暂不可用',
}


def parse(path: Path):
    src = path.read_text(encoding='utf-8')
    blocks = re.findall(r"\{\s*\n\s*id:.*?\n\s*\},?", src, re.S)
    for b in blocks:
        name = re.search(r"name: '([^']+)'", b).group(1)
        kind = re.search(r"institutionKind: '([^']+)'", b).group(1)
        level = re.search(r"institutionLevel: '([^']+)'", b).group(1)
        wm = re.search(r"website: '([^']+)'", b)
        website = wm.group(1) if wm else '—'
        status = re.search(r"websiteStatus: '([^']+)'", b).group(1)
        vm = re.search(r"lastVerifiedAt: '([^']+)'", b)
        verified_at = vm.group(1) if vm else VERIFY_DATE
        yield name, f'{KIND_LABEL[kind]}·{LEVEL_LABEL[level]}', website, STATUS_LABEL[status], verified_at


def main():
    rows = []
    for f in DATA_FILES:
        rows += list(parse(ROOT / f))
    lines = [
        '| # | 机构名称 | 类型 | 官方网站 | 核实状态 | 核实日期 |',
        '| --- | --- | --- | --- | --- | --- |',
    ]
    for i, (name, kind, website, status, verified_at) in enumerate(rows, 1):
        lines.append(f'| {i} | {name} | {kind} | {website} | {status} | {verified_at} |')
    out = ROOT / 'verification-table.md'
    out.write_text('\n'.join(lines) + '\n', encoding='utf-8', newline='\n')
    print(f'共 {len(rows)} 个机构，已写入 {out.name}')


if __name__ == '__main__':
    main()
