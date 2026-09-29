// ==========================================================================
// 地图点位视觉分类与样式（工B · 地图组件）
// 契约来源：contract-v2.md「数据类型 · 地图点位视觉分类」与「工具与 Hook」
//   getPointCategory(inst): MapPointCategory
//   POINT_CATEGORY_META: Record<MapPointCategory,
//     { label: string; color: string; symbol: string; size: number }>
// 七类点位（颜色 + 形状双重编码，不只靠颜色传达类型）：
//   本科院校      绿色圆形      #1F6B45
//   高职院校      浅绿色圆形    #66A182 （educationLevel === '高职'）
//   国家级总院    金色六边形    #D6A84B （path:// 自定义）
//   国家级专业所  橙色菱形      #E08A3C
//   省级综合农科院 蓝绿色方形   #2E8B7A
//   省级专业研究所 青色三角形   #3FB8C4
//   地市级机构    灰绿色小圆点  #8FA89B （institutionLevel ∈ {municipal, regional}）
// ==========================================================================
import type { AgriculturalInstitution, MapPointCategory } from '../types/institution';

/**
 * 金色六边形自定义 symbol（平顶，单位坐标系，echarts 自动按 symbolSize 缩放）。
 * 顶点： (1,0) (0.5,±0.866) (-0.5,±0.866) (-1,0)
 */
export const HEXAGON_SYMBOL =
  'path://M1,0 L0.5,0.866 L-0.5,0.866 L-1,0 L-0.5,-0.866 L0.5,-0.866 Z';

/** 单个点位分类的视觉描述 */
export interface PointCategoryMeta {
  /** 中文标签（图例 / 徽章共用，形状之外的文字编码） */
  label: string;
  /** 主色 */
  color: string;
  /** echarts symbol（'circle' | 'rect' | 'triangle' | 'diamond' | 'path://…'） */
  symbol: string;
  /** 基准 symbolSize（px） */
  size: number;
}

export const POINT_CATEGORY_META: Record<MapPointCategory, PointCategoryMeta> = {
  university_bachelor: { label: '本科院校', color: '#1F6B45', symbol: 'circle', size: 12 },
  university_vocational: { label: '高职院校', color: '#66A182', symbol: 'circle', size: 11 },
  national_academy: { label: '国家级总院', color: '#D6A84B', symbol: HEXAGON_SYMBOL, size: 17 },
  national_institute: { label: '国家级专业所', color: '#E08A3C', symbol: 'diamond', size: 12 },
  provincial_academy: { label: '省级综合农科院', color: '#2E8B7A', symbol: 'rect', size: 11 },
  provincial_institute: { label: '省级专业研究所', color: '#3FB8C4', symbol: 'triangle', size: 11 },
  municipal: { label: '地市级机构', color: '#8FA89B', symbol: 'circle', size: 7 },
};

/**
 * 展示顺序（图例 / scatter 系列统一使用）：
 * 总院 → 专业所 → 本科 → 高职 → 省农科院 → 省专业所 → 地市级。
 * 当前数据暂无省级专业所与地市级，但函数与元信息对全部 7 类完整支持。
 */
export const MAP_POINT_CATEGORY_ORDER: MapPointCategory[] = [
  'national_academy',
  'national_institute',
  'university_bachelor',
  'university_vocational',
  'provincial_academy',
  'provincial_institute',
  'municipal',
];

/**
 * 判定机构的地图点位分类。
 * 优先级：地市级（municipal/regional 级别）> 院校（按 educationLevel）> 科研机构（按 kind + level）。
 */
export function getPointCategory(inst: AgriculturalInstitution): MapPointCategory {
  if (inst.institutionLevel === 'municipal' || inst.institutionLevel === 'regional') {
    return 'municipal';
  }
  if (inst.institutionKind === 'university') {
    return inst.educationLevel === '高职' ? 'university_vocational' : 'university_bachelor';
  }
  if (inst.institutionKind === 'research_academy') {
    return inst.institutionLevel === 'national' ? 'national_academy' : 'provincial_academy';
  }
  // research_institute
  return inst.institutionLevel === 'national' ? 'national_institute' : 'provincial_institute';
}
