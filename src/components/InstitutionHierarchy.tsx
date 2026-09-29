// ==========================================================================
// 科研体系浏览组件（工E · 科研体系组件）
// 契约来源：contract-v2.md「组件契约 · 工E」
//   InstitutionHierarchy({ systems, institutions, selectedId,
//                          expandedSystemId, onSelect, onExpandSystem })
//   id=hierarchy，标题「科研体系浏览」；国家级/省级两组可折叠面板；
//   点击机构 onSelect(id)；点击组头 onExpandSystem(id)。
// ==========================================================================
import { useEffect, useMemo, useState } from 'react';
import { Building2, ChevronDown, Landmark, Network } from 'lucide-react';
import type { AgriculturalInstitution } from '../types/institution';
import {
  buildInstitutionTree,
  findInstitutionTreeNode,
  type InstitutionTreeNode,
} from '../utils/buildInstitutionTree';
import { InstitutionTree } from './InstitutionTree';

export interface InstitutionHierarchyProps {
  systems: Array<{ id: string; name: string; count: number }>;
  institutions: AgriculturalInstitution[];
  selectedId: string | null;
  expandedSystemId: string | null;
  onSelect: (id: string) => void;
  onExpandSystem: (id: string | null) => void;
}

/** 国家级总院展示顺序：中国农科院 → 热科院 → 水科院 → 林科院 */
const NATIONAL_SYSTEM_ORDER = [
  'caas',
  'catas',
  'chinese-academy-of-fishery-sciences',
  'chinese-academy-of-forestry',
];

/** 省级农科院按省份习惯排序（行政区划惯用次序） */
const PROVINCE_ORDER = [
  '北京市', '天津市', '河北省', '山西省', '内蒙古自治区',
  '辽宁省', '吉林省', '黑龙江省',
  '上海市', '江苏省', '浙江省', '安徽省', '福建省', '江西省', '山东省',
  '河南省', '湖北省', '湖南省', '广东省', '广西壮族自治区', '海南省',
  '重庆市', '四川省', '贵州省', '云南省', '西藏自治区',
  '陕西省', '甘肃省', '青海省', '宁夏回族自治区', '新疆维吾尔自治区',
  '香港特别行政区', '澳门特别行政区', '台湾省',
];

interface SystemEntry {
  id: string;
  name: string;
  count: number;
  institution: AgriculturalInstitution;
  node: InstitutionTreeNode | null;
}

/** 单个总院的可折叠面板 */
function SystemPanel({
  entry,
  expanded,
  selectedId,
  expandedIds,
  onSelect,
  onToggle,
  onExpandSystem,
}: {
  entry: SystemEntry;
  expanded: boolean;
  selectedId: string | null;
  expandedIds: Set<string>;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
  onExpandSystem: (id: string | null) => void;
}) {
  const { institution, count } = entry;
  const contentId = `hierarchy-panel-${entry.id}`;
  const isAcademySelected = selectedId === entry.id;

  return (
    <div
      className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-300 ${
        expanded ? 'border-agri-primary/40 shadow-md' : 'border-agri-primary/10 hover:border-agri-primary/30'
      }`}
    >
      {/* 组头：名称 + 下属计数 + 展开箭头（受控展开） */}
      <button
        type="button"
        onClick={() => onExpandSystem(expanded ? null : entry.id)}
        aria-expanded={expanded}
        aria-controls={contentId}
        aria-label={`${expanded ? '收起' : '展开'}${institution.name}体系`}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-all duration-300 hover:bg-agri-bg/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-agri-primary"
      >
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
            expanded ? 'bg-agri-primary text-white' : 'bg-agri-primary/10 text-agri-primary'
          }`}
          aria-hidden="true"
        >
          <Building2 className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span
            className={`block truncate text-sm font-semibold transition-colors duration-300 ${
              isAcademySelected ? 'text-agri-primary' : 'text-agri-text'
            }`}
          >
            {institution.name}
          </span>
          <span className="mt-0.5 block text-xs text-agri-muted">
            {institution.province}
            {count > 1 ? ` · ${count - 1} 个下属机构` : ' · 数据集内暂无下属机构'}
          </span>
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-agri-muted transition-transform duration-300 ${
            expanded ? 'rotate-180 text-agri-primary' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {/* 展开内容：以该总院为根的体系树 */}
      {expanded && (
        <div
          id={contentId}
          role="region"
          aria-label={`${institution.name}体系树`}
          className="border-t border-agri-primary/10 bg-agri-bg/40 px-2 py-2"
        >
          {entry.node ? (
            <div role="tree" aria-label={`${institution.name}及其下属机构`}>
              <InstitutionTree
                node={entry.node}
                selectedId={selectedId}
                expandedIds={expandedIds}
                onSelect={onSelect}
                onToggle={onToggle}
              />
            </div>
          ) : (
            <p className="px-3 py-2 text-xs text-agri-muted">未找到该总院的体系数据。</p>
          )}
          <p className="px-3 pb-1 pt-2 text-xs text-agri-muted">
            点击机构名称可在地图与卡片中定位。
          </p>
        </div>
      )}
    </div>
  );
}

export function InstitutionHierarchy({
  systems,
  institutions,
  selectedId,
  expandedSystemId,
  onSelect,
  onExpandSystem,
}: InstitutionHierarchyProps) {
  // 面板内树节点的展开状态（本地管理；总院根节点随面板展开自动展开）
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const handleToggle = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // 选中机构变化时，沿 parentInstitutionId 链展开其全部祖先（只展开选中路径，
  // 其余节点保持折叠，避免数百节点一次性渲染）
  useEffect(() => {
    if (!selectedId) return;
    const byId = new Map(institutions.map((i) => [i.id, i]));
    const ancestors: string[] = [];
    let current = byId.get(selectedId);
    const guard = new Set<string>();
    while (current?.parentInstitutionId && !guard.has(current.id)) {
      guard.add(current.id);
      const parent = byId.get(current.parentInstitutionId);
      if (!parent) break;
      ancestors.push(parent.id);
      current = parent;
    }
    if (ancestors.length === 0) return;
    setExpandedIds((prev) => {
      const next = new Set(prev);
      for (const id of ancestors) next.add(id);
      return next;
    });
  }, [selectedId, institutions]);

  // 全量机构一次性构树，各总院面板按 id 取子树
  const forest = useMemo(() => buildInstitutionTree(institutions), [institutions]);

  const entries = useMemo<SystemEntry[]>(() => {
    const byId = new Map(institutions.map((i) => [i.id, i]));
    return systems.flatMap((system) => {
      const institution = byId.get(system.id);
      if (!institution) return [];
      return [
        {
          id: system.id,
          name: system.name,
          count: system.count,
          institution,
          node: findInstitutionTreeNode(forest, system.id),
        },
      ];
    });
  }, [systems, institutions, forest]);

  const nationalSystems = useMemo(() => {
    const list = entries.filter((e) => e.institution.institutionLevel === 'national');
    return list.sort((a, b) => {
      const ia = NATIONAL_SYSTEM_ORDER.indexOf(a.id);
      const ib = NATIONAL_SYSTEM_ORDER.indexOf(b.id);
      if (ia !== -1 || ib !== -1) {
        return (ia === -1 ? Number.MAX_SAFE_INTEGER : ia) - (ib === -1 ? Number.MAX_SAFE_INTEGER : ib);
      }
      return a.institution.name.localeCompare(b.institution.name, 'zh');
    });
  }, [entries]);

  const provincialSystems = useMemo(() => {
    const list = entries.filter((e) => e.institution.institutionLevel !== 'national');
    return list.sort((a, b) => {
      const pa = PROVINCE_ORDER.indexOf(a.institution.province);
      const pb = PROVINCE_ORDER.indexOf(b.institution.province);
      const oa = pa === -1 ? PROVINCE_ORDER.length : pa;
      const ob = pb === -1 ? PROVINCE_ORDER.length : pb;
      if (oa !== ob) return oa - ob;
      return a.institution.name.localeCompare(b.institution.name, 'zh');
    });
  }, [entries]);

  const renderGroup = (
    title: string,
    description: string,
    list: SystemEntry[],
    gridClassName: string,
  ) => (
    <div className="mt-10">
      <div className="mb-4 flex items-center gap-3">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-agri-primary text-white"
          aria-hidden="true"
        >
          <Landmark className="h-4 w-4" />
        </span>
        <div>
          <h3 className="text-lg font-bold text-agri-text">
            {title}
            <span className="ml-2 rounded-full bg-agri-primary/10 px-2 py-0.5 text-xs font-medium text-agri-primary">
              {list.length} 个总院
            </span>
          </h3>
          <p className="text-xs text-agri-muted">{description}</p>
        </div>
      </div>
      <div className={gridClassName}>
        {list.map((entry) => (
          <SystemPanel
            key={entry.id}
            entry={entry}
            expanded={expandedSystemId === entry.id}
            selectedId={selectedId}
            expandedIds={expandedIds}
            onSelect={onSelect}
            onToggle={handleToggle}
            onExpandSystem={onExpandSystem}
          />
        ))}
      </div>
    </div>
  );

  return (
    <section id="hierarchy" aria-labelledby="hierarchy-title" className="bg-white py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* 区块标题 */}
        <div className="text-center">
          <span
            className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-agri-primary/10 text-agri-primary"
            aria-hidden="true"
          >
            <Network className="h-6 w-6" />
          </span>
          <h2 id="hierarchy-title" className="mt-4 text-2xl font-bold text-agri-text sm:text-3xl">
            科研体系浏览
          </h2>
          <div className="mx-auto mt-3 h-1 w-12 rounded-full bg-agri-accent" aria-hidden="true" />
          <p className="mx-auto mt-4 max-w-2xl text-sm text-agri-muted sm:text-base">
            点击总院展开下属研究所，点击机构在地图与卡片中定位。
          </p>
        </div>

        {renderGroup(
          '国家级科研体系',
          '中国农业科学院、中国热带农业科学院、中国水产科学研究院、中国林业科学研究院及其院属研究所。',
          nationalSystems,
          'grid grid-cols-1 gap-4 lg:grid-cols-2 items-start',
        )}

        {renderGroup(
          '省级科研体系',
          '各省份综合农业科学院（按省份习惯排序），点击总院可查看详情并定位。',
          provincialSystems,
          'grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 items-start',
        )}
      </div>
    </section>
  );
}

export default InstitutionHierarchy;
