#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# ==========================================================================
# V4 科研数据生成器：从 audit/*.json + audit/parents.json 生成
# src/data/research/ 下的新增数据分片，并重建 index.ts。
# 幂等可重跑：输出完全由本脚本与 scripts/research-id-map.json 决定。
# 用法：python scripts/build-research-data.py
# ==========================================================================
import json
import math
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
AUDIT = ROOT / 'audit'
OUT = ROOT / 'src' / 'data' / 'research'

AUDIT_DATE = '2026-09-30'

# ---------------------------------------------------------------- 输入读取
parents = {p['id']: p for p in json.load(open(AUDIT / 'parents.json', encoding='utf-8'))}
id_map = json.load(open(ROOT / 'scripts' / 'research-id-map.json', encoding='utf-8'))

# audit academyId（约定值）→ parents.json 权威 id（未列出的即相同）
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

def canon_parent_id(audit_id: str) -> str:
    return PARENT_ID_ALIAS.get(audit_id, audit_id)

# 现有 48 条记录（拆分后的分片）：id 列表 + 父院 researchFields（兜底用）
def parse_existing_shard(path: Path):
    text = path.read_text(encoding='utf-8')
    ids = re.findall(r"^    id: '([^']+)',", text, re.M)
    fields_by_id = {}
    for m in re.finditer(r"^    id: '([^']+)',\n(?:.*\n)*?    researchFields: \[([^\]]*)\],", text, re.M):
        rid, raw = m.group(1), m.group(2)
        fields_by_id[rid] = re.findall(r"'([^']+)'", raw)
    return ids, fields_by_id

existing_ids = []
parent_fields = {}
for fn in ['nationalAcademies.ts', 'caasInstitutes.ts', 'provincialAcademies.ts']:
    ids, fmap = parse_existing_shard(OUT / fn)
    existing_ids += ids
    parent_fields.update(fmap)
assert len(existing_ids) == 48, f'现有记录应为 48 条，实得 {len(existing_ids)}'

# 现有 14 个农科院所名称（n1 跳过规则二次确认用）
existing_caas_names = re.findall(
    r"^    name: '([^']+)',", (OUT / 'caasInstitutes.ts').read_text(encoding='utf-8'), re.M)
assert len(existing_caas_names) == 14

# ---------------------------------------------------------------- 字典
CITY_TO_PROVINCE = {
    '北京': '北京市', '天津': '天津市', '上海': '上海市', '重庆': '重庆市',
    '新乡': '河南省', '安阳': '河南省', '郑州': '河南省',
    '武汉': '湖北省', '长沙': '湖南省', '兴城': '辽宁省',
    '杭州': '浙江省', '长春': '吉林省', '公主岭': '吉林省',
    '成都': '四川省', '南京': '江苏省', '无锡': '江苏省',
    '青岛': '山东省', '哈尔滨': '黑龙江省',
    '海口': '海南省', '儋州': '海南省', '万宁': '海南省', '文昌': '海南省', '三亚': '海南省',
    '湛江': '广东省', '广州': '广东省', '深圳': '广东省',
    '昆明': '云南省',
}
MUNICIPALITY_FULL = {'北京': '北京市', '天津': '天津市', '上海': '上海市', '重庆': '重庆市'}

PROVINCE_TO_REGION = {
    '北京市': '华北地区', '天津市': '华北地区', '河北省': '华北地区', '山西省': '华北地区', '内蒙古自治区': '华北地区',
    '辽宁省': '东北地区', '吉林省': '东北地区', '黑龙江省': '东北地区',
    '上海市': '华东地区', '江苏省': '华东地区', '浙江省': '华东地区', '安徽省': '华东地区',
    '福建省': '华东地区', '江西省': '华东地区', '山东省': '华东地区',
    '河南省': '华中地区', '湖北省': '华中地区', '湖南省': '华中地区',
    '广东省': '华南地区', '广西壮族自治区': '华南地区', '海南省': '华南地区',
    '重庆市': '西南地区', '四川省': '西南地区', '贵州省': '西南地区', '云南省': '西南地区', '西藏自治区': '西南地区',
    '陕西省': '西北地区', '甘肃省': '西北地区', '青海省': '西北地区',
    '宁夏回族自治区': '西北地区', '新疆维吾尔自治区': '西北地区',
}

# 研究领域受控词（与 src/data/researchFields.ts 一致，断言用）
RESEARCH_FIELDS = [
    '作物科学', '作物遗传育种', '植物保护', '园艺', '蔬菜花卉', '土壤肥料', '农业资源与环境',
    '畜牧', '动物遗传育种', '动物营养', '动物繁殖', '兽医学', '动物疫病防控', '兽药', '草业',
    '水产', '林业', '热带农业', '农产品加工', '食品科学', '农产品质量安全', '农业机械',
    '智慧农业', '农业信息', '农业经济', '农村发展', '农业生态', '生物技术', '农业基因组学',
]

ANIMAL_CONTEXT = ('畜', '禽', '猪', '牛', '羊', '鸡', '鸭', '鹅', '兔', '蜂', '蚕', '马', '鹿', '毛皮', '动物')
# 水产语境优先判定（避免「养殖」类词误入畜牧）
AQUATIC_CONTEXT = ('鱼', '渔', '水产', '水生', '捕捞', '养殖工程')

# 关键词 → 受控词（按序匹配，每个自由词取第一条命中的规则）
FIELD_RULES = [
    (('兽医', '兽', '疫病', '禽病', '疫苗', '免疫', '诊断', '共患'), ['兽医学', '动物疫病防控']),
    (('畜牧', '肉牛', '肉羊', '奶牛', '家禽', '养猪', '蜂', '蚕', '家畜', '草食', '鸡', '养殖', '授粉', '毛皮'), ['畜牧']),
    (('饲料', '营养'), ['动物营养']),
    (('繁殖',), ['动物繁殖']),
    (('兽药',), ['兽药']),
    (('草原', '草业', '饲草', '草牧', '草畜', '草地'), ['草业']),
    (('水产', '渔业'), ['水产']),
    (('经济林', '木材', '竹', '桉', '森', '林', '木', '树种', '泡桐', '生物多样性', '自然保护'), ['林业']),
    (('热带', '橡胶', '椰子', '香饮', '南亚', '咖啡', '可可', '芒果', '澳洲坚果', '荔枝', '菠萝', '榴莲', '甘蔗', '蔗'), ['热带农业']),
    (('植保', '农药', '植物保护', '病虫', '植物病', '害虫', '昆虫', '杂草', '生物防治', '绿色防控', '入侵生物', '综合防治', '天敌'), ['植物保护']),
    (('蔬菜', '花卉', '食用菌', '真菌', '菌物', '菌种', '萝卜', '芋', '三角梅'), ['蔬菜花卉']),
    (('园艺', '果树', '茶', '柑桔', '柑橘', '桑', '瓜', '葡萄', '苹果', '梨', '桃', '莓', '香蕉', '龙眼', '枇杷', '火龙果', '枸杞', '中药材', '药用植物', '人参'), ['园艺']),
    (('土肥', '土壤', '肥料', '肥', '耕地', '黑土', '红壤', '盐碱'), ['土壤肥料']),
    (('资环', '环境', '灌溉', '沼气', '能源', '节水', '水肥', '水资源', '排水', '气象', '污染', '废弃物', '循环农业', '旱作', '旱地', '水土保持'), ['农业资源与环境']),
    (('生态', '湿地', '荒漠化', '防沙', '沙地'), ['农业生态']),
    (('加工', '贮藏', '保鲜', '冷链', '采后', '乳', '干燥', '酿造', '烘烤'), ['农产品加工']),
    (('食品',), ['食品科学']),
    (('质标', '质量安全', '检测', '标准', '质量', '风险评估', '风险监测'), ['农产品质量安全']),
    (('农机', '机械', '装备', '设施农业', '设施工程', '温室', '机器人', '植物工厂'), ['农业机械']),
    (('信息', '数字', '智慧', '遥感', '大数据', '数据', '情报', '期刊', '出版', '文献', '智能', '预警'), ['农业信息', '智慧农业']),
    (('经济', '区划', '农经', '政策', '产业', '咨询', '闽台', '合作', '跨境', '交流'), ['农业经济']),
    (('农村', '乡村', '村镇', '规划', '休闲农业', '都市农业', '现代农业', '丘陵农业'), ['农村发展']),
    (('基因', '分子', '生物技术', '微生物', '细胞', '组学', '组织培养', '发酵', '制剂', '生物质', '核农', '辐照', 'DUS', '植物资源', '天然产物', '特色植物'), ['生物技术', '农业基因组学']),
    (('种质', '品种', '繁育', '选育', '种业', '种苗', '引种', '良种', '杂种优势', '加代', '鉴定'), ['作物遗传育种']),
    (('作物', '粮', '棉', '油', '麻', '薯', '玉米', '水稻', '小麦', '大豆', '花生', '烟草', '甜菜',
      '谷子', '高粱', '燕麦', '青稞', '大麦', '荞麦', '稻', '麦', '豆', '芝麻', '栽培', '耕作', '种植'), ['作物科学']),
]

def map_fields(free_fields, parent_id, warnings, unit_name):
    out = []
    for word in free_fields:
        hit = None
        # 动物语境育种优先于作物语境；水产语境优先于「养殖→畜牧」
        if '育种' in word and any(k in word for k in ANIMAL_CONTEXT):
            hit = ['动物遗传育种']
        elif '育种' in word:
            hit = ['作物遗传育种']
        elif any(k in word for k in AQUATIC_CONTEXT):
            hit = ['水产']
        else:
            for keywords, controlled in FIELD_RULES:
                if any(k in word for k in keywords):
                    hit = controlled
                    break
        if hit is None:
            warnings.append(f'字段映射失败：{unit_name} ← 「{word}」')
            continue
        for c in hit:
            if c not in out:
                out.append(c)
    if not out:
        fallback = parent_fields.get(parent_id, [])[:2]
        assert fallback, f'父院 {parent_id} 无 researchFields 可兜底'
        warnings.append(f'字段映射为空，取父院前 2 个受控词：{unit_name} → {fallback}')
        out = list(fallback)
    for c in out:
        assert c in RESEARCH_FIELDS, f'受控词越界：{c}'
    return out

# ---------------------------------------------------------------- 记录生成
used_ids = set(existing_ids)
field_warnings = []
city_failures = []
same_city_counter = {}

def offset_coord(lat, lng, i):
    angle = math.radians(i * 137.5)
    r = 0.008 + 0.004 * (i % 3)
    return round(lat + r * math.cos(angle), 6), round(lng + r * math.sin(angle), 6)

def build_unit(u, parent_id, roster_url, academy_name, level, graduate):
    name = u['name']
    assert name in id_map, f'id 映射缺失：{name}'
    slug = id_map[name]
    assert re.fullmatch(r'[a-z0-9-]+', slug), f'slug 非法：{slug}'
    assert slug not in used_ids, f'id 冲突：{slug}（{name}）'
    used_ids.add(slug)

    parent = parents[parent_id]
    city_raw = u['city']
    if level == 'national':
        assert city_raw in CITY_TO_PROVINCE, f'城市无法解析省份：{city_raw}（{name}）'
        province = CITY_TO_PROVINCE[city_raw]
    else:
        province = parent['province']
    city = MUNICIPALITY_FULL.get(city_raw, city_raw)
    region = PROVINCE_TO_REGION[province]

    if u['sameCity'] and parent.get('lat') is not None and parent.get('lng') is not None:
        i = same_city_counter.get(parent_id, 0)
        same_city_counter[parent_id] = i + 1
        lat, lng = offset_coord(parent['lat'], parent['lng'], i)
        location_source = f'与父院同城（{city}），坐标为父院坐标加确定性偏移以避免点位重叠，精确园区坐标待补'
    else:
        lat = lng = None
        location_source = f'驻地{city}，坐标待补（列入 V5 待办）'

    if u.get('url'):
        url = u['url']
        website = url if url.startswith('http') else 'https://' + url
        data_source = f'{roster_url}（{academy_name}官网单位名单，审计日期 {AUDIT_DATE}）'
    else:
        # rosterUrl 为父院官方单位名单页；个别 audit 记录为文字说明而非 URL，
        # 此时提取其中首个 www./http 链接作为 website，完整说明保留在 dataSource。
        roster_link = roster_url
        if not roster_url.startswith('http'):
            m = re.search(r'(www\.[^\s，；）)]+)', roster_url)
            assert m, f'rosterUrl 非 URL 且无法提取链接：{roster_url}（{name}）'
            roster_link = 'https://' + m.group(1)
        website = roster_link
        data_source = f'{roster_url}（{academy_name}官网单位名单，审计日期 {AUDIT_DATE}）；无独立官网，链接为父院官方单位名单页'

    unit_word = '研究中心' if u['unitType'] == 'research_center' else '研究所'
    level_word = '国家级' if level == 'national' else '省级'
    free_fields = u.get('fields') or []
    if free_fields:
        top = '、'.join(free_fields[:3])
        description = f'{name}是{parent["name"]}下属的{level_word}{unit_word}，驻地{province}{city}，主要从事{top}等领域研究。'
    else:
        description = f'{name}是{parent["name"]}下属的{level_word}{unit_word}，驻地{province}{city}，主要从事农业科学研究与技术推广工作。'

    rec = {
        'id': slug,
        'name': name,
        'shortName': u.get('shortName'),
        'institutionKind': 'research_institute',
        'researchUnitType': u['unitType'],
        'institutionLevel': level,
        'parentInstitutionId': parent_id,
        'parentInstitutionName': parent['name'],
        'affiliationType': 'direct',
        'province': province,
        'city': city,
        'region': region,
        'latitude': lat,
        'longitude': lng,
        'locationSource': location_source,
        'website': website,
        'websiteStatus': 'verified',
        'description': description,
        'researchFields': map_fields(free_fields, parent_id, field_warnings, name),
        'graduateTraining': graduate,
        'dataSource': data_source,
        'lastVerifiedAt': AUDIT_DATE,
    }
    return rec

# ---------------------------------------------------------------- 收集 units
def iter_national(fn, graduate):
    d = json.load(open(AUDIT / fn, encoding='utf-8'))
    pid = canon_parent_id(d['academyId'])
    assert pid in parents, f'parents.json 缺少 {pid}'
    for u in d['units']:
        if u['classification'] != 'include':
            continue
        if fn == 'n1-caas.json' and u['name'] in existing_caas_names:
            assert '已收录' in u.get('reason', ''), f'n1 跳过项 reason 不含「已收录」：{u["name"]}'
            continue
        yield build_unit(u, pid, d['rosterUrl'], d['academy'], 'national', graduate)

def iter_provincial():
    for fn in ['p1-huabei.json', 'p2-dongbei.json', 'p3-huadong.json',
               'p4-huazhong.json', 'p5-huanan.json', 'p6-xibu.json']:
        d = json.load(open(AUDIT / fn, encoding='utf-8'))
        for a in d['academies']:
            pid = canon_parent_id(a['academyId'])
            assert pid in parents, f'parents.json 缺少 {pid}'
            for u in a['units']:
                if u['classification'] != 'include':
                    continue
                yield pid, build_unit(u, pid, a['rosterUrl'], a['academy'], 'provincial', False)

caas_v4 = list(iter_national('n1-caas.json', True))
cafs = list(iter_national('n2-cafs.json', False))
caf = list(iter_national('n3-caf.json', False))
catas = list(iter_national('n4-catas.json', False))
assert len(caas_v4) == 20, f'农科院 V4 新增应为 20，实得 {len(caas_v4)}'
assert len(cafs) == 9 and len(caf) == 14 and len(catas) == 10

SHARD_BY_PARENT = {
    'beijing-academy-of-agriculture-and-forestry-sciences': 'North',
    'tianjin-academy-of-agricultural-sciences': 'North',
    'hebei-academy-of-agriculture-forestry-sciences': 'North',
    'shanxi-academy-agricultural-sciences': 'North',
    'inner-mongolia-aaahs': 'North',
    'liaoning-academy-of-agricultural-sciences': 'Northeast',
    'jilin-academy-of-agricultural-sciences': 'Northeast',
    'heilongjiang-academy-of-agricultural-sciences': 'Northeast',
    'shanghai-academy-of-agricultural-sciences': 'East',
    'jiangsu-academy-of-agricultural-sciences': 'East',
    'zhejiang-academy-of-agricultural-sciences': 'East',
    'anhui-academy-of-agricultural-sciences': 'East',
    'fujian-academy-agricultural-sciences': 'East',
    'jiangxi-academy-agricultural-sciences': 'East',
    'shandong-academy-agricultural-sciences': 'East',
    'henan-academy-of-agricultural-sciences': 'CentralSouth',
    'hubei-academy-of-agricultural-sciences': 'CentralSouth',
    'hunan-aas': 'CentralSouth',
    'guangdong-academy-of-agricultural-sciences': 'CentralSouth',
    'guangxi-academy-of-agricultural-sciences': 'CentralSouth',
    'hainan-academy-of-agricultural-sciences': 'CentralSouth',
    'chongqing-academy-of-agricultural-sciences': 'Southwest',
    'sichuan-academy-of-agricultural-sciences': 'Southwest',
    'guizhou-academy-of-agricultural-sciences': 'Southwest',
    'yunnan-academy-agricultural-sciences': 'Southwest',
    'tibet-aaahs': 'Southwest',
    'gansu-academy-of-agricultural-sciences': 'Northwest',
    'qinghai-academy-agri-forestry-sciences': 'Northwest',
    'ningxia-academy-of-agriculture-and-forestry-sciences': 'Northwest',
    'xinjiang-academy-of-agricultural-sciences': 'Northwest',
}
shards = {k: [] for k in ['North', 'Northeast', 'East', 'CentralSouth', 'Southwest', 'Northwest']}
for pid, rec in iter_provincial():
    shards[SHARD_BY_PARENT[pid]].append(rec)

# ---------------------------------------------------------------- TS 输出
HEADER = """// ==========================================================================
// {title}
// 本文件由 scripts/build-research-data.py 生成，勿手改。
// 来源：audit/*.json 官网母表审计（审计日期 {date}）+ audit/parents.json。
// ==========================================================================
import type {{ AgriculturalInstitution }} from '../../types/institution';

const PLACEHOLDER_IMAGE = {{
  logo: 'placeholders/logo.svg',
  image: 'placeholders/campus.svg',
  imageSource: '占位图，正式上线前替换并核查版权',
}} as const;

export const {name}: AgriculturalInstitution[] = [
{body}];
"""

def ts_str(v):
    return "'" + v.replace('\\', '\\\\').replace("'", "\\'") + "'"

def emit(rec):
    lines = ['  {']
    lines.append(f"    id: {ts_str(rec['id'])},")
    lines.append(f"    name: {ts_str(rec['name'])},")
    if rec['shortName']:
        lines.append(f"    shortName: {ts_str(rec['shortName'])},")
    lines.append(f"    institutionKind: 'research_institute',")
    lines.append(f"    researchUnitType: '{rec['researchUnitType']}',")
    lines.append(f"    institutionLevel: '{rec['institutionLevel']}',")
    lines.append(f"    parentInstitutionId: {ts_str(rec['parentInstitutionId'])},")
    lines.append(f"    parentInstitutionName: {ts_str(rec['parentInstitutionName'])},")
    lines.append(f"    affiliationType: 'direct',")
    lines.append(f"    province: {ts_str(rec['province'])},")
    lines.append(f"    city: {ts_str(rec['city'])},")
    lines.append(f"    region: {ts_str(rec['region'])},")
    lat = 'null' if rec['latitude'] is None else repr(rec['latitude'])
    lng = 'null' if rec['longitude'] is None else repr(rec['longitude'])
    lines.append(f"    latitude: {lat},")
    lines.append(f"    longitude: {lng},")
    lines.append(f"    locationSource: {ts_str(rec['locationSource'])},")
    lines.append(f"    website: {ts_str(rec['website'])},")
    lines.append(f"    websiteStatus: 'verified',")
    lines.append('    ...PLACEHOLDER_IMAGE,')
    lines.append(f"    description: {ts_str(rec['description'])},")
    fields = ', '.join(ts_str(f) for f in rec['researchFields'])
    lines.append(f"    researchFields: [{fields}],")
    if rec['graduateTraining']:
        lines.append('    graduateTraining: true,')
    lines.append(f"    dataSource: {ts_str(rec['dataSource'])},")
    lines.append(f"    lastVerifiedAt: '{AUDIT_DATE}',")
    lines.append('  },')
    return '\n'.join(lines)

def write_shard(fn, title, name, recs):
    body = '\n'.join(emit(r) for r in recs) + '\n'
    (OUT / fn).write_text(HEADER.format(title=title, date=AUDIT_DATE, name=name, body=body),
                          encoding='utf-8', newline='\n')
    return len(recs)

counts = {}
counts['caasInstitutesV4.ts'] = write_shard(
    'caasInstitutesV4.ts', '中国农业科学院院属研究所（V4 新增 20 个）', 'caasInstitutesV4', caas_v4)
counts['cafsInstitutes.ts'] = write_shard(
    'cafsInstitutes.ts', '中国水产科学研究院院属单位（V4 新增 9 个）', 'cafsInstitutes', cafs)
counts['cafInstitutes.ts'] = write_shard(
    'cafInstitutes.ts', '中国林业科学研究院院属单位（V4 新增 14 个）', 'cafInstitutes', caf)
counts['catasInstitutes.ts'] = write_shard(
    'catasInstitutes.ts', '中国热带农业科学院院属单位（V4 新增 10 个）', 'catasInstitutes', catas)
shard_meta = [
    ('North', 'provincialInstitutesNorth.ts', 'provincialInstitutesNorth', '省级农科院院属单位 · 华北（京津冀晋蒙）'),
    ('Northeast', 'provincialInstitutesNortheast.ts', 'provincialInstitutesNortheast', '省级农科院院属单位 · 东北（辽吉黑）'),
    ('East', 'provincialInstitutesEast.ts', 'provincialInstitutesEast', '省级农科院院属单位 · 华东（沪苏浙皖闽鲁赣）'),
    ('CentralSouth', 'provincialInstitutesCentralSouth.ts', 'provincialInstitutesCentralSouth', '省级农科院院属单位 · 中南（豫鄂湘粤桂琼）'),
    ('Southwest', 'provincialInstitutesSouthwest.ts', 'provincialInstitutesSouthwest', '省级农科院院属单位 · 西南（渝川贵云藏）'),
    ('Northwest', 'provincialInstitutesNorthwest.ts', 'provincialInstitutesNorthwest', '省级农科院院属单位 · 西北（甘青宁新）'),
]
for key, fn, name, title in shard_meta:
    counts[fn] = write_shard(fn, title, name, shards[key])

# index.ts 重建
index = """// ==========================================================================
// 科研机构数据聚合（V4：48 条存量 + {total} 条新增，分片合并）
// 顺序：国家总院 → 农科院所（存量+V4新增）→ 水科院所 → 林科院所 → 热科院所
//       → 省级总院 → 省级各分片（华北/东北/华东/中南/西南/西北）
// 本文件由 scripts/build-research-data.py 生成，勿手改。
// ==========================================================================
import type {{ AgriculturalInstitution }} from '../../types/institution';
import {{ nationalAcademies }} from './nationalAcademies';
import {{ caasInstitutes }} from './caasInstitutes';
import {{ caasInstitutesV4 }} from './caasInstitutesV4';
import {{ cafsInstitutes }} from './cafsInstitutes';
import {{ cafInstitutes }} from './cafInstitutes';
import {{ catasInstitutes }} from './catasInstitutes';
import {{ provincialAcademies }} from './provincialAcademies';
import {{ provincialInstitutesNorth }} from './provincialInstitutesNorth';
import {{ provincialInstitutesNortheast }} from './provincialInstitutesNortheast';
import {{ provincialInstitutesEast }} from './provincialInstitutesEast';
import {{ provincialInstitutesCentralSouth }} from './provincialInstitutesCentralSouth';
import {{ provincialInstitutesSouthwest }} from './provincialInstitutesSouthwest';
import {{ provincialInstitutesNorthwest }} from './provincialInstitutesNorthwest';

export const researchInstitutes: AgriculturalInstitution[] = [
  ...nationalAcademies,
  ...caasInstitutes,
  ...caasInstitutesV4,
  ...cafsInstitutes,
  ...cafInstitutes,
  ...catasInstitutes,
  ...provincialAcademies,
  ...provincialInstitutesNorth,
  ...provincialInstitutesNortheast,
  ...provincialInstitutesEast,
  ...provincialInstitutesCentralSouth,
  ...provincialInstitutesSouthwest,
  ...provincialInstitutesNorthwest,
];
"""
total = sum(counts.values())
(OUT / 'index.ts').write_text(index.format(total=total), encoding='utf-8', newline='\n')

# ---------------------------------------------------------------- 报告
print('== 各文件条数 ==')
for fn, n in counts.items():
    print(f'  {fn}: {n}')
print(f'总条数: {total}（国家级 {len(caas_v4)+len(cafs)+len(caf)+len(catas)} + 省级 {sum(counts[fn] for _, fn, _, _ in shard_meta)}）')
print(f'字段映射警告 {len(field_warnings)} 条：')
for w in field_warnings:
    print('  ' + w)
print(f'城市解析失败 {len(city_failures)} 条：')
for w in city_failures:
    print('  ' + w)
if city_failures:
    sys.exit(1)
