// ==========================================================================
// 机构筛选 / 统计工具（组件工C · 筛选组件）
// 契约来源：contract-v2.md「工具与 Hook」一节
//   - filterInstitutions(list, f)
//   - computeInstitutionStats(list)
//   - getProvinces(list) / getSystems(list) / getFields(list)
// 另导出集成便捷项（不改变契约签名）：
//   DEFAULT_INSTITUTION_FILTERS / RESEARCH_SUB_TYPE_LABELS /
//   InstitutionSystemSummary / computeSubTypeCounts
// ==========================================================================
import type {
  AgriculturalInstitution,
  InstitutionFilters,
  InstitutionStats,
  ResearchSubType,
} from '@/types/institution';
import { RESEARCH_FIELDS } from '@/data/researchFields';

/** 契约规定的筛选条件初始值 */
export const DEFAULT_INSTITUTION_FILTERS: InstitutionFilters = {
  search: '',
  kind: 'all',
  subTypes: [],
  level: 'all',
  system: 'all',
  region: '全部地区',
  province: '全部省份',
  field: '全部领域',
  graduateOnly: false,
  websiteStatus: 'all',
};

/** 科研院所二级类型中文标签（二级 chips 与结果摘要行共用，保证文案一致） */
export const RESEARCH_SUB_TYPE_LABELS: Record<ResearchSubType, string> = {
  national_academy: '国家级总院',
  national_institute: '国家级专业所',
  provincial_academy: '省级综合农科院',
  provincial_institute: '省级专业研究所',
  municipal: '地市级研究院',
  forestry: '林业科研机构',
  aquatic: '水产科研机构',
  veterinary: '畜牧兽医科研机构',
};

/** 科研体系概要（总院 + 下属机构数），结构同契约 Array<{ id; name; count }> */
export interface InstitutionSystemSummary {
  id: string;
  name: string;
  count: number;
}

// ───────────────────────────── 内部工具 ─────────────────────────────

/** 科研类机构 = 国家级/省级总院 + 专业研究所（契约 kind='research' 语义） */
const isResearchInstitution = (inst: AgriculturalInstitution): boolean =>
  inst.institutionKind === 'research_academy' || inst.institutionKind === 'research_institute';

const containsIgnoreCase = (source: string | undefined, keyword: string): boolean =>
  source !== undefined && source.toLowerCase().includes(keyword);

/**
 * 搜索匹配字段（契约）：name / shortName / province / city /
 * parentInstitutionName / researchFields / description。
 * keyword 需已在调用处 trim + 小写化。
 */
function matchesSearch(inst: AgriculturalInstitution, keyword: string): boolean {
  return (
    containsIgnoreCase(inst.name, keyword) ||
    containsIgnoreCase(inst.shortName, keyword) ||
    containsIgnoreCase(inst.province, keyword) ||
    containsIgnoreCase(inst.city, keyword) ||
    containsIgnoreCase(inst.parentInstitutionName, keyword) ||
    containsIgnoreCase(inst.description, keyword) ||
    (inst.researchFields ?? []).some((field) => field.toLowerCase().includes(keyword))
  );
}

/**
 * 科研院所二级类型判定（契约映射；多个 subType 之间取并集）：
 *   national_academy    = 总院 && 国家级
 *   national_institute  = 专业所 && 国家级
 *   provincial_academy  = 总院 && 省级
 *   provincial_institute= 专业所 && 省级
 *   municipal           = 级别 ∈ {地市级, 区域性}
 *   forestry / aquatic / veterinary = researchFields 分别含 '林业' / '水产' /
 *                                     ('兽医学' | '畜牧' | '动物疫病防控')
 */
function matchesSubType(inst: AgriculturalInstitution, subType: ResearchSubType): boolean {
  const isAcademy = inst.institutionKind === 'research_academy';
  const isInstitute = inst.institutionKind === 'research_institute';
  const fields = inst.researchFields ?? [];
  switch (subType) {
    case 'national_academy':
      return isAcademy && inst.institutionLevel === 'national';
    case 'national_institute':
      return isInstitute && inst.institutionLevel === 'national';
    case 'provincial_academy':
      return isAcademy && inst.institutionLevel === 'provincial';
    case 'provincial_institute':
      return isInstitute && inst.institutionLevel === 'provincial';
    case 'municipal':
      return inst.institutionLevel === 'municipal' || inst.institutionLevel === 'regional';
    case 'forestry':
      return fields.includes('林业');
    case 'aquatic':
      return fields.includes('水产');
    case 'veterinary':
      return fields.some((f) => f === '兽医学' || f === '畜牧' || f === '动物疫病防控');
  }
}

// ───────────────────────────── 契约函数 ─────────────────────────────

/**
 * 按全部条件过滤机构列表。各条件之间为 AND；subTypes 内部为 OR（并集）。
 *
 * 口径说明（供集成/审计知悉）：
 * - system：仅匹配下属机构（parentInstitutionId === 总院 id），不含总院自身，
 *   与 getSystems 的 count 口径严格一致，保证体系下拉中的 name(count) 与
 *   结果计数逐项吻合。总院自身仍可通过大类 tab、省份等其他条件检索到。
 */
export function filterInstitutions(
  list: AgriculturalInstitution[],
  f: InstitutionFilters,
): AgriculturalInstitution[] {
  const keyword = f.search.trim().toLowerCase();
  return list.filter((inst) => {
    // 关键词
    if (keyword && !matchesSearch(inst, keyword)) return false;
    // 机构大类：'research' 同时含 research_academy + research_institute
    if (f.kind === 'university' && inst.institutionKind !== 'university') return false;
    if (f.kind === 'research' && !isResearchInstitution(inst)) return false;
    // 科研院所二级类型（空数组 = 不限制；多选取并集）
    if (f.subTypes.length > 0 && !f.subTypes.some((s) => matchesSubType(inst, s))) return false;
    // 机构级别
    if (f.level !== 'all' && inst.institutionLevel !== f.level) return false;
    // 科研体系（仅下属机构，口径见上方说明）
    if (f.system !== 'all' && inst.parentInstitutionId !== f.system) return false;
    // 所在地区
    if (f.region !== '全部地区' && inst.region !== f.region) return false;
    // 省份
    if (f.province !== '全部省份' && inst.province !== f.province) return false;
    // 研究领域
    if (f.field !== '全部领域' && !(inst.researchFields ?? []).includes(f.field)) return false;
    // 仅看招收研究生机构
    if (f.graduateOnly && inst.graduateTraining !== true) return false;
    // 官网核实状态
    if (f.websiteStatus !== 'all' && inst.websiteStatus !== f.websiteStatus) return false;
    return true;
  });
}

/** 数据集整体统计（契约 InstitutionStats 全部 10 项） */
export function computeInstitutionStats(list: AgriculturalInstitution[]): InstitutionStats {
  const hasField = (inst: AgriculturalInstitution, predicate: (field: string) => boolean) =>
    (inst.researchFields ?? []).some(predicate);
  // 畜牧兽医类：含 兽医 / 畜牧 / 动物疫病 任一（覆盖 兽医学、动物疫病防控）
  const isVeterinaryField = (field: string) =>
    field.includes('兽医') || field.includes('畜牧') || field.includes('动物疫病');
  // 作物与植保类：含 作物 / 植物保护 任一（覆盖 作物科学、作物遗传育种）
  const isCropOrPlantProtectionField = (field: string) =>
    field.includes('作物') || field.includes('植物保护');

  return {
    universityTotal: list.filter((i) => i.institutionKind === 'university').length,
    researchTotal: list.filter(isResearchInstitution).length,
    nationalAcademies: list.filter(
      (i) => i.institutionKind === 'research_academy' && i.institutionLevel === 'national',
    ).length,
    nationalInstitutes: list.filter(
      (i) => i.institutionKind === 'research_institute' && i.institutionLevel === 'national',
    ).length,
    provincialAcademies: list.filter(
      (i) => i.institutionKind === 'research_academy' && i.institutionLevel === 'provincial',
    ).length,
    provincialInstitutes: list.filter(
      (i) => i.institutionKind === 'research_institute' && i.institutionLevel === 'provincial',
    ).length,
    provinces: new Set(list.map((i) => i.province)).size,
    verifiedWebsites: list.filter((i) => i.websiteStatus === 'verified').length,
    veterinaryRelated: list.filter((i) => hasField(i, isVeterinaryField)).length,
    cropAndPlantProtection: list.filter((i) => hasField(i, isCropOrPlantProtectionField)).length,
  };
}

/**
 * 省级行政区习惯排序（华北→东北→华东→华中→华南→西南→西北→港澳台）。
 * 键为数据集中使用的标准全称（如「内蒙古自治区」「新疆维吾尔自治区」）。
 */
const PROVINCE_ORDER: string[] = [
  '北京市', '天津市', '河北省', '山西省', '内蒙古自治区',
  '辽宁省', '吉林省', '黑龙江省',
  '上海市', '江苏省', '浙江省', '安徽省', '福建省', '江西省', '山东省',
  '河南省', '湖北省', '湖南省',
  '广东省', '广西壮族自治区', '海南省',
  '重庆市', '四川省', '贵州省', '云南省', '西藏自治区',
  '陕西省', '甘肃省', '青海省', '宁夏回族自治区', '新疆维吾尔自治区',
  '香港特别行政区', '澳门特别行政区', '台湾省',
];

const provinceRank = (province: string): number => {
  const index = PROVINCE_ORDER.indexOf(province);
  return index === -1 ? PROVINCE_ORDER.length : index;
};

/** 数据集中出现过的省份去重，按区域习惯顺序排列 */
export function getProvinces(list: AgriculturalInstitution[]): string[] {
  return Array.from(new Set(list.map((i) => i.province))).sort(
    (a, b) => provinceRank(a) - provinceRank(b) || a.localeCompare(b, 'zh-Hans-CN'),
  );
}

/**
 * 总院列表（数据集中全部 kind=research_academy 机构）。
 * count = 数据集中 parentInstitutionId === 该院 id 的机构数量（仅下属，不含自身）。
 * 排序：国家级总院在前（保持数据集原顺序），省级农科院按省份习惯顺序排列。
 */
export function getSystems(list: AgriculturalInstitution[]): InstitutionSystemSummary[] {
  const levelRank = (inst: AgriculturalInstitution): number =>
    inst.institutionLevel === 'national' ? 0 : inst.institutionLevel === 'provincial' ? 1 : 2;
  const academies = list
    .filter((i) => i.institutionKind === 'research_academy')
    .sort(
      (a, b) =>
        levelRank(a) - levelRank(b) ||
        provinceRank(a.province) - provinceRank(b.province) ||
        a.name.localeCompare(b.name, 'zh-Hans-CN'),
    );
  return academies.map((academy) => ({
    id: academy.id,
    name: academy.name,
    count: list.filter((i) => i.parentInstitutionId === academy.id).length,
  }));
}

/** 数据集中实际出现的 researchFields 去重，按 RESEARCH_FIELDS 受控词表顺序排列 */
export function getFields(list: AgriculturalInstitution[]): string[] {
  const present = new Set<string>();
  for (const inst of list) {
    for (const field of inst.researchFields ?? []) present.add(field);
  }
  return RESEARCH_FIELDS.filter((field) => present.has(field));
}

// ────────────────────────── 集成便捷项（非契约必需） ──────────────────────────

/**
 * 各二级类型在数据集中的机构数量（InstitutionTypeTabs 的 subTypeCounts 徽章用）。
 * 与 filterInstitutions 共用同一套 matchesSubType 谓词，保证计数与筛选结果一致。
 */
export function computeSubTypeCounts(
  list: AgriculturalInstitution[],
): Record<ResearchSubType, number> {
  const counts: Record<ResearchSubType, number> = {
    national_academy: 0,
    national_institute: 0,
    provincial_academy: 0,
    provincial_institute: 0,
    municipal: 0,
    forestry: 0,
    aquatic: 0,
    veterinary: 0,
  };
  const subTypes = Object.keys(counts) as ResearchSubType[];
  for (const inst of list) {
    for (const subType of subTypes) {
      if (matchesSubType(inst, subType)) counts[subType] += 1;
    }
  }
  return counts;
}
