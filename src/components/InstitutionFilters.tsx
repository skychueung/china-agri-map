// ==========================================================================
// 地区与条件筛选面板（组件工C · 筛选组件）
// 契约来源：contract-v2.md「组件契约 · 工C」
//   InstitutionFilters({ filters, onChange, provinces, systems, fields, resultCount })
//   - id=filter，标题「地区与条件筛选」
//   - 地区标签组（单选）/ 省份 / 科研体系 / 研究领域（FIELD_GROUPS 分组）/
//     机构级别 / 仅看招收研究生 / 仅看官网已核实 / 结果提示行（aria-live）
//   - 不含搜索框（全局搜索由 Header 承担）
// ==========================================================================
import { SlidersHorizontal } from 'lucide-react';
import type {
  InstitutionFilters as InstitutionFiltersValue,
  InstitutionLevel,
  Region,
  WebsiteStatus,
} from '@/types/institution';
import { FIELD_GROUPS } from '@/data/researchFields';
import {
  EDU_TYPE_LABELS,
  RESEARCH_SUB_TYPE_LABELS,
  UNIVERSITY_CATEGORY_LABELS,
  type InstitutionSystemSummary,
} from '@/utils/institutionFilters';
import { cn } from '@/lib/utils';

export interface InstitutionFiltersProps {
  filters: InstitutionFiltersValue;
  onChange: (patch: Partial<InstitutionFiltersValue>) => void;
  provinces: string[];
  systems: InstitutionSystemSummary[];
  fields: string[];
  resultCount: number;
}

/** 地区标签组：全部地区 + 7 大陆区域（港澳台地区暂无收录机构，不列入） */
const REGION_OPTIONS: Array<'全部地区' | Region> = [
  '全部地区',
  '华北地区',
  '东北地区',
  '华东地区',
  '华中地区',
  '华南地区',
  '西南地区',
  '西北地区',
];

const LEVEL_LABELS: Record<InstitutionLevel, string> = {
  national: '国家级',
  provincial: '省级',
  municipal: '地市级',
  regional: '区域性',
};

const WEBSITE_STATUS_LABELS: Record<WebsiteStatus, string> = {
  verified: '官网已核实',
  pending: '官网待核实',
  unavailable: '官网不可用',
};

/** 结果提示行的「拼接条件」摘要 */
function buildActiveSummary(
  filters: InstitutionFiltersValue,
  systems: InstitutionSystemSummary[],
): string {
  const parts: string[] = [];
  const keyword = filters.search.trim();
  if (keyword) parts.push(`关键词“${keyword}”`);
  if (filters.kind === 'university') parts.push('农业院校');
  if (filters.kind === 'research') parts.push('科研院所');
  if (filters.subTypes.length > 0) {
    parts.push(filters.subTypes.map((s) => RESEARCH_SUB_TYPE_LABELS[s]).join('、'));
  }
  if (filters.uniCategories.length > 0) {
    parts.push(filters.uniCategories.map((c) => `${UNIVERSITY_CATEGORY_LABELS[c]}类`).join('、'));
  }
  if (filters.eduType !== 'all') parts.push(EDU_TYPE_LABELS[filters.eduType]);
  if (filters.level !== 'all') parts.push(LEVEL_LABELS[filters.level]);
  if (filters.system !== 'all') {
    parts.push(systems.find((s) => s.id === filters.system)?.name ?? '指定科研体系');
  }
  if (filters.region !== '全部地区') parts.push(filters.region);
  if (filters.province !== '全部省份') parts.push(filters.province);
  if (filters.field !== '全部领域') parts.push(filters.field);
  if (filters.graduateOnly) parts.push('招收研究生');
  if (filters.websiteStatus !== 'all') parts.push(WEBSITE_STATUS_LABELS[filters.websiteStatus]);
  return parts.length > 0 ? parts.join(' · ') : '全部机构';
}

const SELECT_CLASS = cn(
  'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-agri-text transition-all duration-300',
  'hover:border-agri-primary/50 focus-visible:border-agri-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-agri-primary/30',
);

const LABEL_CLASS = 'mb-1.5 block text-sm font-medium text-agri-text';

export default function InstitutionFilters({
  filters,
  onChange,
  provinces,
  systems,
  fields,
  resultCount,
}: InstitutionFiltersProps) {
  const summary = buildActiveSummary(filters, systems);

  // fields 中未被 FIELD_GROUPS 覆盖的值兜底分组（受控词表下理论为空，防御性保留）
  const groupedValues = new Set(FIELD_GROUPS.flatMap((group) => group.fields));
  const ungroupedFields = fields.filter((f) => !groupedValues.has(f));

  return (
    <section id="filter" aria-labelledby="filter-title" className="scroll-mt-24">
      <div className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5 text-agri-primary" aria-hidden="true" />
          <h2 id="filter-title" className="text-lg font-bold text-agri-text sm:text-xl">
            地区与条件筛选
          </h2>
        </div>

        {/* 地区标签组（单选） */}
        <div className="mb-5">
          <span id="filter-region-label" className={LABEL_CLASS}>
            所在地区
          </span>
          <div role="group" aria-labelledby="filter-region-label" className="flex flex-wrap gap-2">
            {REGION_OPTIONS.map((region) => {
              const active = filters.region === region;
              return (
                <button
                  key={region}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onChange({ region })}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-sm transition-all duration-300',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-agri-primary focus-visible:ring-offset-1',
                    active
                      ? 'border-agri-primary bg-agri-primary font-medium text-white'
                      : 'border-agri-primary/20 bg-agri-bg/60 text-agri-text hover:border-agri-primary/60 hover:text-agri-primary',
                  )}
                >
                  {region}
                </button>
              );
            })}
          </div>
        </div>

        {/* 下拉筛选组 */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* 省份 */}
          <div>
            <label htmlFor="filter-province" className={LABEL_CLASS}>
              省份
            </label>
            <select
              id="filter-province"
              value={filters.province}
              onChange={(e) => onChange({ province: e.target.value })}
              className={SELECT_CLASS}
            >
              <option value="全部省份">全部省份</option>
              {provinces.map((province) => (
                <option key={province} value={province}>
                  {province}
                </option>
              ))}
            </select>
          </div>

          {/* 科研体系 */}
          <div>
            <label htmlFor="filter-system" className={LABEL_CLASS}>
              科研体系
            </label>
            <select
              id="filter-system"
              value={filters.system}
              onChange={(e) => onChange({ system: e.target.value })}
              className={SELECT_CLASS}
            >
              <option value="all">全部体系</option>
              {systems.map((system) => (
                <option key={system.id} value={system.id}>
                  {system.name}（{system.count}）
                </option>
              ))}
            </select>
          </div>

          {/* 研究领域（按 FIELD_GROUPS 分组） */}
          <div>
            <label htmlFor="filter-field" className={LABEL_CLASS}>
              研究领域
            </label>
            <select
              id="filter-field"
              value={filters.field}
              onChange={(e) => onChange({ field: e.target.value })}
              className={SELECT_CLASS}
            >
              <option value="全部领域">全部领域</option>
              {FIELD_GROUPS.map((group) => {
                const options = group.fields.filter((f) => fields.includes(f));
                if (options.length === 0) return null;
                return (
                  <optgroup key={group.label} label={group.label}>
                    {options.map((field) => (
                      <option key={field} value={field}>
                        {field}
                      </option>
                    ))}
                  </optgroup>
                );
              })}
              {ungroupedFields.length > 0 && (
                <optgroup label="其他">
                  {ungroupedFields.map((field) => (
                    <option key={field} value={field}>
                      {field}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* 机构级别 */}
          <div>
            <label htmlFor="filter-level" className={LABEL_CLASS}>
              机构级别
            </label>
            <select
              id="filter-level"
              value={filters.level}
              onChange={(e) =>
                onChange({ level: e.target.value as InstitutionFiltersValue['level'] })
              }
              className={SELECT_CLASS}
            >
              <option value="all">全部级别</option>
              {(Object.keys(LEVEL_LABELS) as InstitutionLevel[]).map((level) => (
                <option key={level} value={level}>
                  {LEVEL_LABELS[level]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 复选项 */}
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-agri-text">
            <input
              type="checkbox"
              checked={filters.graduateOnly}
              onChange={(e) => onChange({ graduateOnly: e.target.checked })}
              className="h-4 w-4 shrink-0 rounded border-gray-300 accent-agri-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-agri-primary focus-visible:ring-offset-1"
            />
            仅看招收研究生机构
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-agri-text">
            <input
              type="checkbox"
              checked={filters.websiteStatus === 'verified'}
              onChange={(e) => onChange({ websiteStatus: e.target.checked ? 'verified' : 'all' })}
              className="h-4 w-4 shrink-0 rounded border-gray-300 accent-agri-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-agri-primary focus-visible:ring-offset-1"
            />
            仅看官网已核实
          </label>
        </div>

        {/* 结果提示行（筛选变化时向读屏器播报） */}
        <p
          role="status"
          aria-live="polite"
          className="mt-5 border-t border-agri-primary/10 pt-4 text-sm text-agri-muted"
        >
          当前显示：<span className="font-medium text-agri-text">{summary}</span>，共{' '}
          <span className="font-semibold text-agri-primary">{resultCount}</span> 个机构
        </p>
      </div>
    </section>
  );
}
