// ==========================================================================
// 机构大类 Tabs + 科研院所二级多选 chips（组件工C · 筛选组件）
// 契约来源：contract-v2.md「组件契约 · 工C」
//   InstitutionTypeTabs({ kind, onKindChange, counts,
//                         subTypes, onSubTypesChange, subTypeCounts })
//   - 一级 3 个大 tab：全部机构 / 农业院校 / 科研院所（带计数徽章）
//   - kind='research' 时展开二级多选 chips（8 类，带计数，0 计数置灰禁用）
// ==========================================================================
import { Check, FlaskConical, GraduationCap, LayoutGrid } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { KindFilter, ResearchSubType } from '@/types/institution';
import { RESEARCH_SUB_TYPE_LABELS } from '@/utils/institutionFilters';
import { cn } from '@/lib/utils';

export interface InstitutionTypeTabsProps {
  kind: KindFilter;
  onKindChange: (k: KindFilter) => void;
  counts: { all: number; university: number; research: number };
  subTypes: ResearchSubType[];
  onSubTypesChange: (s: ResearchSubType[]) => void;
  subTypeCounts: Record<ResearchSubType, number>;
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

export default function InstitutionTypeTabs({
  kind,
  onKindChange,
  counts,
  subTypes,
  onSubTypesChange,
  subTypeCounts,
}: InstitutionTypeTabsProps) {
  const handleKindChange = (next: KindFilter) => {
    onKindChange(next);
    // 离开「科研院所」大类时清空二级多选，避免残留 subTypes 继续过滤其他大类
    if (next !== 'research' && subTypes.length > 0) onSubTypesChange([]);
  };

  const toggleSubType = (target: ResearchSubType) => {
    onSubTypesChange(
      subTypes.includes(target)
        ? subTypes.filter((s) => s !== target)
        : [...subTypes, target],
    );
  };

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
    </div>
  );
}
