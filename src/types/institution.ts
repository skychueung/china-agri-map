export type InstitutionKind = 'university' | 'research_academy' | 'research_institute';
export type InstitutionLevel = 'national' | 'provincial' | 'municipal' | 'regional';
export type AffiliationType = 'direct' | 'joint' | 'dual' | 'independent';
export type WebsiteStatus = 'verified' | 'pending' | 'unavailable';
export type EducationLevel = 'bachelor' | 'associate';
export type EducationType = 'regular' | 'vocational';
export type UniversityCategory =
  | 'agriculture'
  | 'forestry'
  | 'aquatic'
  | 'animal_husbandry'
  | 'agricultural_engineering'
  | 'agriculture_featured_comprehensive';
export type UniversityAffiliation =
  | 'ministry_of_education'
  | 'other_central'
  | 'provincial'
  | 'municipal'
  | 'xpcc';
export type CoordinateSystem = 'WGS84' | 'GCJ02' | 'BD09';
export type Region = '东北地区' | '华北地区' | '华东地区' | '华中地区' | '华南地区' | '西南地区' | '西北地区' | '港澳台地区';

export interface AgriculturalInstitution {
  id: string;
  name: string;
  shortName?: string;
  institutionKind: InstitutionKind;
  institutionLevel: InstitutionLevel;
  parentInstitutionId?: string;
  parentInstitutionName?: string;
  affiliationType?: AffiliationType;
  province: string;
  city: string;
  region: Region;
  address?: string;
  latitude: number | null;
  longitude: number | null;
  locationSource?: string;
  website?: string | null;
  websiteStatus: WebsiteStatus;
  logo?: string;
  image?: string;
  imageSource?: string;
  description: string;
  researchFields?: string[];
  educationLevel?: EducationLevel;       // 院校用：bachelor 本科 / associate 高职专科
  educationType?: EducationType;         // 院校用：regular 普通 / vocational 职业
  universityCategory?: UniversityCategory[]; // 院校涉农分类（可多标签）
  affiliationCategory?: UniversityAffiliation; // 院校隶属类型
  inclusionReason?: string;              // 涉农综合大学等非典型收录对象的收录依据
  coordinateSystem?: CoordinateSystem;   // 经纬度所属坐标系（逐条标注，未统一转换）
  graduateTraining?: boolean;
  featured?: boolean;
  dataSource?: string;
  lastVerifiedAt?: string;
}

// 筛选
export type KindFilter = 'all' | 'university' | 'research';
export type ResearchSubType =
  | 'national_academy' | 'national_institute'
  | 'provincial_academy' | 'provincial_institute'
  | 'municipal' | 'forestry' | 'aquatic' | 'veterinary';
export interface InstitutionFilters {
  search: string;
  kind: KindFilter;
  subTypes: ResearchSubType[];          // 科研院所二级筛选（多选，空数组=不限制）
  uniCategories: UniversityCategory[];  // 院校涉农分类二级筛选（多选，空数组=不限制）
  eduType: 'all' | 'regular_bachelor' | 'vocational_bachelor'; // 院校办学类型筛选
  level: 'all' | InstitutionLevel;
  system: string;                       // 'all' 或某总院 id
  region: '全部地区' | Region;
  province: string;                     // '全部省份' 或具体省份
  field: string;                        // '全部领域' 或研究领域
  graduateOnly: boolean;
  websiteStatus: 'all' | WebsiteStatus;
}

// 统计
export interface InstitutionStats {
  universityTotal: number;
  researchTotal: number;
  nationalAcademies: number;
  nationalInstitutes: number;
  provincialAcademies: number;
  provincialInstitutes: number;
  provinces: number;
  verifiedWebsites: number;
  veterinaryRelated: number;      // researchFields 含 兽医/畜牧/动物疫病 任一
  cropAndPlantProtection: number; // researchFields 含 作物/植物保护 任一
  regularBachelorTotal: number;    // 普通本科院校数（university 且非职业教育）
  vocationalBachelorTotal: number; // 职业本科院校数（educationType === 'vocational'）
}

// 地图点位视觉分类
export type MapPointCategory =
  | 'university_bachelor'    // 绿色圆形
  | 'university_vocational'  // 浅绿色圆形
  | 'national_academy'       // 金色六边形
  | 'national_institute'     // 橙色菱形
  | 'provincial_academy'     // 蓝绿色方形
  | 'provincial_institute'   // 青色三角形
  | 'municipal';             // 灰绿色小点
