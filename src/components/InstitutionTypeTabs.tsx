// ==========================================================================
// 机构大类 Tabs + 二级 chips（组件工C · 筛选组件）
// 契约来源：contract-v2.md「组件契约 · 工C」
//   InstitutionTypeTabs({ kind, onKindChange, counts,
//                         subTypes, onSubTypesChange, subTypeCounts,
//                         uniCategories, onUniCategoriesChange,
//                         eduType, onEduTypeChange, uniCounts })
//   - 一级 3 个大 tab：全部机构 / 农业院校 / 科研院所（带计数徽章）
//   - kind='research' 时展开科研院所二级多选 chips（8 类，带计数，0 计数置灰禁用）
//   - kind='university' 时展开院校二级 chips：全部 + 涉农分类多选 + 办学类型单选
// ==========================================================================
import { Check, FlaskConical, GraduationCap, LayoutGrid } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type {
  InstitutionFilters,
  KindFilter,
  ResearchSubType,
  UniversityCategory,
} from '@/types/institution';
import {
  EDU_TYPE_LABELS,
  RESEARCH_SUB_TYPE_LABELS,
  UNIVERSITY_CATEGORY_LABELS,
  type UniversityChipCounts,
} from '@/utils/institutionFilters';
import { cn } from '@/lib/utils';

export interface InstitutionTypeTabsProps {
  kind: KindFilter;
  onKindChange: (k: KindFilter) => void;
  counts: { all: number; university: number; research: number };
  subTypes: ResearchSubType[];
  onSubTypesChange: (s: ResearchSubType[]) => void;
  subTypeCounts: Record<ResearchSubType, number>;
  uniCategories: UniversityCategory[];
  onUniCategoriesChange: (c: UniversityCategory[]) => void;
  eduType: InstitutionFilters['eduType'];
  onEduTypeChange: (t: InstitutionFilters['eduType']) => void;
  uniCounts: UniversityChipCounts;
}

const KIND_TABS: Array<{ value: KindFilter; label: string; icon: LucideIcon }> = [
  { value: 'all', label: '全部机构', icon: LayoutGrid },
  { value: 'university', label: '农业院校', icon: GraduationCap },
  { value: 'research', label: '科研院所', icon: FlaskConical },
];

/** 二级 chips 展示顺序（契约枚举顺序） */
const SUB_TYPE_ORDER: ResearchSubType[] = [
  'national_academy',
  'national_institute',
  'provincial_academy',
  'provincial_institute',
  'municipal',
  'forestry',
  'aquatic',
  'veterinary',
];

/** 院校涉农分类 chips 展示顺序 */
const UNI_CATEGORY_ORDER: UniversityCategory[] = [
  'agriculture',
  'forestry',
  'aquatic',
  'animal_husbandry',
  'agricultural_engineering',
  'agriculture_featured_comprehensive',
];

/** 院校办学类型 chips（单选，'all' 不单独成 chip，由「全部」承担） */
const EDU_TYPE_ORDER: Array<Exclude<InstitutionFilters['eduType'], 'all'>> = [
  'regular_bachelor',
  'vocational_bachelor',
];

export default function InstitutionTypeTabs({
  kind,
  onKindChange,
  counts,
  subTypes,
  onSubTypesChange,
  subTypeCounts,
  uniCategories,
  onUniCategoriesChange,
  eduType,
  onEduTypeChange,
  uniCounts,
}: InstitutionTypeTabsProps) {
  const handleKindChange = (next: KindFilter) => {
    onKindChange(next);
    // 离开「科研院所」大类时清空二级多选，避免残留 subTypes 继续过滤其他大类
    if (next !== 'research' && subTypes.length > 0) onSubTypesChange([]);
    // 离开「农业院校」大类时清空院校二级筛选
    if (next !== 'university') {
      if (uniCategories.length > 0) onUniCategoriesChange([]);
      if (eduType !== 'all') onEduTypeChange('all');
    }
  };

  const toggleSubType = (target: ResearchSubType) => {
    onSubTypesChange(
      subTypes.includes(target)
        ? subTypes.filter((s) => s !== target)
        : [...subTypes, target],
    );
  };

  const toggleUniCategory = (target: UniversityCategory) => {
    onUniCategoriesChange(
      uniCategories.includes(target)
        ? uniCategories.filter((c) => c !== target)
        : [...uniCategories, target],
    );
  };

  /** 办学类型单选：点击已选中的 chip 回到不限制 */
  const handleEduType = (target: Exclude<InstitutionFilters['eduType'], 'all'>) => {
    onEduTypeChange(eduType === target ? 'all' : target);
  };

  const uniAllActive = uniCategories.length === 0 && eduType === 'all';

  const eduTypeCount = (t: Exclude<InstitutionFilters['eduType'], 'all'>): number =>
    t === 'regular_bachelor' ? uniCounts.regularBachelor : uniCounts.vocationalBachelor;

  return (
    <div className="w-full">
      {/* 一级大类 tab（单选） */}
      <div role="group" aria-label="机构大类" className="grid grid-cols-3 gap-2 sm:gap-3">
        {KIND_TABS.map(({ value, label, icon: Icon }) => {
          const active = kind === value;
          return (
            <button
              key={value}
              type="button"
              aria-pressed={active}
              onClick={() => handleKindChange(value)}
              className={cn(
                'flex items-center justify-center gap-1.5 rounded-2xl border px-2 py-3 text-sm font-medium transition-all duration-300 sm:gap-2 sm:px-3 sm:text-base',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-agri-primary focus-visible:ring-offset-2',
                active
                  ? 'border-agri-primary bg-agri-primary text-white shadow-md'
                  : 'border-agri-primary/20 bg-white text-agri-text hover:border-agri-primary/60 hover:bg-agri-bg',
              )}
            >
              <Icon className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" aria-hidden="true" />
              <span>{label}</span>
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-xs tabular-nums',
                  active ? 'bg-white/20 text-white' : 'bg-agri-bg text-agri-primary',
                )}
              >
                {counts[value]}
              </span>
            </button>
          );
        })}
      </div>

      {/* 二级多选 chips：仅 kind='research' 时展开 */}
      {kind === 'research' && (
        <div className="mt-3 rounded-2xl border border-agri-primary/15 bg-agri-bg/60 p-3 transition-all duration-300 sm:p-4">
          <p className="mb-2 text-xs text-agri-muted">
            科研院所二级筛选（可多选，不选即为全部科研院所）
          </p>
          <div role="group" aria-label="科研院所二级类型（可多选）" className="flex flex-wrap gap-2">
            {SUB_TYPE_ORDER.map((subType) => {
              const active = subTypes.includes(subType);
              const count = subTypeCounts[subType];
              const disabled = count === 0;
              return (
                <button
                  key={subType}
                  type="button"
                  aria-pressed={active}
                  disabled={disabled}
                  title={disabled ? '当前数据集中暂无此类机构' : undefined}
                  onClick={() => toggleSubType(subType)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-all duration-300',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-agri-primary focus-visible:ring-offset-1',
                    disabled && 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400',
                    !disabled &&
                      active &&
                      'border-agri-primary bg-agri-primary/10 font-medium text-agri-primary',
                    !disabled &&
                      !active &&
                      'border-gray-200 bg-white text-agri-text hover:border-agri-primary/50 hover:text-agri-primary',
                  )}
                >
                  {/* 选中态除颜色外另有对勾图标 + 加粗 + aria-pressed，不只靠颜色区分 */}
                  {active && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                  <span>{RESEARCH_SUB_TYPE_LABELS[subType]}</span>
                  <span
                    className={cn(
                      'text-xs tabular-nums',
                      disabled ? 'text-gray-400' : active ? 'text-agri-primary' : 'text-agri-muted',
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
      {/* 院校二级 chips：仅 kind='university' 时展开 */}
      {kind === 'university' && (
        <div className="mt-3 rounded-2xl border border-agri-primary/15 bg-agri-bg/60 p-3 transition-all duration-300 sm:p-4">
          <p className="mb-2 text-xs text-agri-muted">
            农业院校二级筛选（涉农分类可多选，办学类型单选，不选即为全部院校）
          </p>
          <div role="group" aria-label="农业院校二级类型" className="flex flex-wrap gap-2">
            {/* 全部 */}
            <button
              type="button"
              aria-pressed={uniAllActive}
              onClick={() => {
                onUniCategoriesChange([]);
                onEduTypeChange('all');
              }}
              className={cn(
                'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-all duration-300',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-agri-primary focus-visible:ring-offset-1',
                uniAllActive
                  ? 'border-agri-primary bg-agri-primary/10 font-medium text-agri-primary'
                  : 'border-gray-200 bg-white text-agri-text hover:border-agri-primary/50 hover:text-agri-primary',
              )}
            >
              {uniAllActive && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
              <span>全部</span>
              <span
                className={cn(
                  'text-xs tabular-nums',
                  uniAllActive ? 'text-agri-primary' : 'text-agri-muted',
                )}
              >
                {counts.university}
              </span>
            </button>

            {/* 涉农分类（多选） */}
            {UNI_CATEGORY_ORDER.map((category) => {
              const active = uniCategories.includes(category);
              const count = uniCounts.categories[category];
              const disabled = count === 0;
              return (
                <button
                  key={category}
                  type="button"
                  aria-pressed={active}
                  disabled={disabled}
                  title={disabled ? '当前数据集中暂无此类院校' : undefined}
                  onClick={() => toggleUniCategory(category)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-all duration-300',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-agri-primary focus-visible:ring-offset-1',
                    disabled && 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400',
                    !disabled &&
                      active &&
                      'border-agri-primary bg-agri-primary/10 font-medium text-agri-primary',
                    !disabled &&
                      !active &&
                      'border-gray-200 bg-white text-agri-text hover:border-agri-primary/50 hover:text-agri-primary',
                  )}
                >
                  {active && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                  <span>{UNIVERSITY_CATEGORY_LABELS[category]}类</span>
                  <span
                    className={cn(
                      'text-xs tabular-nums',
                      disabled ? 'text-gray-400' : active ? 'text-agri-primary' : 'text-agri-muted',
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}

            {/* 办学类型（单选） */}
            {EDU_TYPE_ORDER.map((t) => {
              const active = eduType === t;
              const count = eduTypeCount(t);
              const disabled = count === 0;
              return (
                <button
                  key={t}
                  type="button"
                  aria-pressed={active}
                  disabled={disabled}
                  title={disabled ? '当前数据集中暂无此类院校' : undefined}
                  onClick={() => handleEduType(t)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-all duration-300',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-agri-primary focus-visible:ring-offset-1',
                    disabled && 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400',
                    !disabled &&
                      active &&
                      'border-agri-primary bg-agri-primary/10 font-medium text-agri-primary',
                    !disabled &&
                      !active &&
                      'border-gray-200 bg-white text-agri-text hover:border-agri-primary/50 hover:text-agri-primary',
                  )}
                >
                  {active && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                  <span>{EDU_TYPE_LABELS[t]}</span>
                  <span
                    className={cn(
                      'text-xs tabular-nums',
                      disabled ? 'text-gray-400' : active ? 'text-agri-primary' : 'text-agri-muted',
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
