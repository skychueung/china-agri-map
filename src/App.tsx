// ==========================================================================
// 中国农业院校与科研院所地图导航平台 · V2 根组件（集成层）
// 契约来源：contract-v2.md「集成约定」
//   页面顺序：Header / Hero / InstitutionTypeTabs / ChinaInstitutionMap(#map) /
//   StatisticsSection / InstitutionFilters(#filter) / InstitutionGrid(universities) /
//   InstitutionGrid(institutes) / InstitutionHierarchy(#hierarchy) / About / Footer
//   状态：useInstitutionFilters + useMapSelection；联动见各 handler 注释。
// ==========================================================================
import { useCallback, useEffect, useMemo } from 'react';
import { agriculturalInstitutions } from '@/data/agriculturalInstitutions';
import { useInstitutionFilters } from '@/hooks/useInstitutionFilters';
import { useMapSelection } from '@/hooks/useMapSelection';
import {
  buildInstitutionTree,
  collectDescendantIds,
  findInstitutionTreeNode,
} from '@/utils/buildInstitutionTree';
import { computeSubTypeCounts, computeUniversityChipCounts } from '@/utils/institutionFilters';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import InstitutionTypeTabs from '@/components/InstitutionTypeTabs';
import ChinaInstitutionMap from '@/components/ChinaInstitutionMap';
import StatisticsSection from '@/components/StatisticsSection';
import InstitutionFilters from '@/components/InstitutionFilters';
import InstitutionGrid from '@/components/InstitutionGrid';
import InstitutionHierarchy from '@/components/InstitutionHierarchy';
import AboutSection from '@/components/AboutSection';
import Footer from '@/components/Footer';

/** 平滑滚动到指定 id 的元素（不存在时静默忽略） */
function scrollToId(id: string, block: ScrollLogicalPosition = 'start') {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block });
}

export default function App() {
  const {
    filters,
    setFilters,
    resetFilters,
    filtered,
    provinces,
    systems,
    fields,
    stats,
  } = useInstitutionFilters(agriculturalInstitutions);

  const { selectedId, hoveredId, select, hover, expandedSystemId, expandSystem } =
    useMapSelection();

  // ── 数据切分（契约）：filtered 中院校进院校网格，其余进科研院所网格；全量进地图 ──
  const filteredUniversities = useMemo(
    () => filtered.filter((i) => i.institutionKind === 'university'),
    [filtered],
  );
  const filteredResearch = useMemo(
    () => filtered.filter((i) => i.institutionKind !== 'university'),
    [filtered],
  );

  /** 科研院所二级 chips 计数（基于全量科研机构，与当前筛选无关） */
  const subTypeCounts = useMemo(
    () =>
      computeSubTypeCounts(
        agriculturalInstitutions.filter((i) => i.institutionKind !== 'university'),
      ),
    [],
  );

  /** 院校二级 chips 计数（基于全量院校，与当前筛选无关） */
  const uniCounts = useMemo(
    () => computeUniversityChipCounts(agriculturalInstitutions),
    [],
  );

  /** 全量机构一次性构树（选中总院时收集下属 id 用） */
  const forest = useMemo(() => buildInstitutionTree(agriculturalInstitutions), []);

  /** 选中总院 → 全部下属机构 id（地图金色描边高亮）；选中非总院 → 空数组 */
  const highlightedIds = useMemo(() => {
    if (!selectedId) return [];
    const selected = agriculturalInstitutions.find((i) => i.id === selectedId);
    if (!selected || selected.institutionKind !== 'research_academy') return [];
    const node = findInstitutionTreeNode(forest, selectedId);
    return node ? collectDescendantIds(node) : [];
  }, [selectedId, forest]);

  // ── 联动 handler ────────────────────────────────────────────────────────

  /** Header 全局搜索（Header 已自行滚动到 #filter） */
  const handleSearch = useCallback(
    (q: string) => setFilters({ search: q }),
    [setFilters],
  );

  /** 地图点位点击：'' → 取消选中；否则选中并滚动到对应卡片 */
  const handleMapSelect = useCallback(
    (id: string) => {
      if (id === '') {
        select(null);
        return;
      }
      select(id);
      scrollToId(`card-${id}`, 'center');
    },
    [select],
  );

  /** 卡片「地图定位」：选中 + 滚动到地图 */
  const handleLocate = useCallback(
    (id: string) => {
      select(id);
      scrollToId('map');
    },
    [select],
  );

  /** 「查看所属体系」：展开体系面板 + 体系筛选 + 滚动到 #hierarchy */
  const handleViewSystem = useCallback(
    (systemId: string) => {
      expandSystem(systemId);
      setFilters({ system: systemId });
      // 筛选变化会重排机构网格、页面高度随之收缩，
      // 等 React 重渲染与布局稳定后再平滑滚动，避免滚动目标漂移
      window.setTimeout(() => scrollToId('hierarchy'), 200);
    },
    [expandSystem, setFilters],
  );

  /** 体系树点击机构：选中 + 滚动到对应卡片 */
  const handleHierarchySelect = useCallback(
    (id: string) => {
      select(id);
      scrollToId(`card-${id}`, 'center');
    },
    [select],
  );

  /** EmptyState 广播的全局重置事件：清空筛选 + 取消选中 */
  useEffect(() => {
    const handleReset = () => {
      resetFilters();
      select(null);
    };
    window.addEventListener('agri:reset-filters', handleReset);
    return () => window.removeEventListener('agri:reset-filters', handleReset);
  }, [resetFilters, select]);

  // ── 渲染 ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen">
      <Header onSearch={handleSearch} />

      <main>
        <HeroSection />

        {/* 机构大类 Tabs + 科研院所二级 chips */}
        <section aria-label="机构大类切换" className="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
          <InstitutionTypeTabs
            kind={filters.kind}
            onKindChange={(kind) => setFilters({ kind })}
            counts={{
              all: agriculturalInstitutions.length,
              university: stats.universityTotal,
              research: stats.researchTotal,
            }}
            subTypes={filters.subTypes}
            onSubTypesChange={(subTypes) => setFilters({ subTypes })}
            subTypeCounts={subTypeCounts}
            uniCategories={filters.uniCategories}
            onUniCategoriesChange={(uniCategories) => setFilters({ uniCategories })}
            eduType={filters.eduType}
            onEduTypeChange={(eduType) => setFilters({ eduType })}
            uniCounts={uniCounts}
          />
        </section>

        <ChinaInstitutionMap
          institutions={filtered}
          hoveredId={hoveredId}
          selectedId={selectedId}
          highlightedIds={highlightedIds}
          onHover={hover}
          onSelect={handleMapSelect}
        />

        <StatisticsSection stats={stats} />

        {/* 条件筛选 + 机构网格 */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="py-10">
            <InstitutionFilters
              filters={filters}
              onChange={setFilters}
              provinces={provinces}
              systems={systems}
              fields={fields}
              resultCount={filtered.length}
            />
          </div>

          <InstitutionGrid
            title="农业院校"
            id="universities"
            institutions={filteredUniversities}
            hoveredId={hoveredId}
            selectedId={selectedId}
            onHover={hover}
            onSelect={select}
            onLocate={handleLocate}
            onViewSystem={handleViewSystem}
            emptyOnReset={resetFilters}
          />

          <div className="mt-12">
            <InstitutionGrid
              title="农业科研院所"
              id="institutes"
              institutions={filteredResearch}
              hoveredId={hoveredId}
              selectedId={selectedId}
              onHover={hover}
              onSelect={select}
              onLocate={handleLocate}
              onViewSystem={handleViewSystem}
              emptyOnReset={resetFilters}
            />
          </div>
        </div>

        <div className="mt-16">
          <InstitutionHierarchy
            systems={systems}
            institutions={agriculturalInstitutions}
            selectedId={selectedId}
            expandedSystemId={expandedSystemId}
            onSelect={handleHierarchySelect}
            onExpandSystem={expandSystem}
          />
        </div>

        <AboutSection />
      </main>

      <Footer />
    </div>
  );
}
