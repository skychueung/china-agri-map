// ==========================================================================
// 全量机构数据聚合（合并导出：院校 + 科研机构，页面唯一数据源）
// 契约来源：contract-v2.md「数据文件」一节
// ==========================================================================
import type { AgriculturalInstitution } from '../types/institution';
import { universities } from './universities';
import { researchInstitutes } from './researchInstitutes';

export const agriculturalInstitutions: AgriculturalInstitution[] = [
  ...universities,
  ...researchInstitutes,
];

/** 国家级总院列表（含中国农科院、热科院、水科院、林科院） */
export const nationalAcademies: AgriculturalInstitution[] = researchInstitutes.filter(
  (i) => i.institutionKind === 'research_academy' && i.institutionLevel === 'national',
);

/** 省级农科院列表 */
export const provincialAcademies: AgriculturalInstitution[] = researchInstitutes.filter(
  (i) => i.institutionKind === 'research_academy' && i.institutionLevel === 'provincial',
);
