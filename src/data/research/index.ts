// ==========================================================================
// 科研机构数据聚合（V4：48 条存量 + 509 条新增，分片合并）
// 顺序：国家总院 → 农科院所（存量+V4新增）→ 水科院所 → 林科院所 → 热科院所
//       → 省级总院 → 省级各分片（华北/东北/华东/中南/西南/西北）
// 本文件由 scripts/build-research-data.py 生成，勿手改。
// ==========================================================================
import type { AgriculturalInstitution } from '../../types/institution';
import { nationalAcademies } from './nationalAcademies';
import { caasInstitutes } from './caasInstitutes';
import { caasInstitutesV4 } from './caasInstitutesV4';
import { cafsInstitutes } from './cafsInstitutes';
import { cafInstitutes } from './cafInstitutes';
import { catasInstitutes } from './catasInstitutes';
import { provincialAcademies } from './provincialAcademies';
import { provincialInstitutesNorth } from './provincialInstitutesNorth';
import { provincialInstitutesNortheast } from './provincialInstitutesNortheast';
import { provincialInstitutesEast } from './provincialInstitutesEast';
import { provincialInstitutesCentralSouth } from './provincialInstitutesCentralSouth';
import { provincialInstitutesSouthwest } from './provincialInstitutesSouthwest';
import { provincialInstitutesNorthwest } from './provincialInstitutesNorthwest';

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
