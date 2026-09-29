// ==========================================================================
// 机构筛选状态 Hook（组件工C · 筛选组件）
// 契约来源：contract-v2.md「工具与 Hook」一节
//   useInstitutionFilters(list) →
//   { filters, setFilters(patch), resetFilters, filtered,
//     provinces, systems, fields, stats }
//   其中 stats / provinces / systems / fields 基于全量 list（useMemo）。
// ==========================================================================
import { useCallback, useMemo, useState } from 'react';
import type { AgriculturalInstitution, InstitutionFilters } from '@/types/institution';
import {
  DEFAULT_INSTITUTION_FILTERS,
  computeInstitutionStats,
  filterInstitutions,
  getFields,
  getProvinces,
  getSystems,
} from '@/utils/institutionFilters';

/** 生成一份全新默认筛选条件（避免与常量共享 subTypes 数组引用） */
const createDefaultFilters = (): InstitutionFilters => ({
  ...DEFAULT_INSTITUTION_FILTERS,
  subTypes: [],
});

export function useInstitutionFilters(list: AgriculturalInstitution[]) {
  const [filters, setFiltersState] = useState<InstitutionFilters>(createDefaultFilters);

  /** 合并式更新：setFilters({ province: '北京市' }) */
  const setFilters = useCallback((patch: Partial<InstitutionFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...patch }));
  }, []);

  /** 重置为契约默认值 */
  const resetFilters = useCallback(() => {
    setFiltersState(createDefaultFilters());
  }, []);

  const filtered = useMemo(() => filterInstitutions(list, filters), [list, filters]);

  // 以下四项基于全量 list，与当前筛选条件无关
  const provinces = useMemo(() => getProvinces(list), [list]);
  const systems = useMemo(() => getSystems(list), [list]);
  const fields = useMemo(() => getFields(list), [list]);
  const stats = useMemo(() => computeInstitutionStats(list), [list]);

  return { filters, setFilters, resetFilters, filtered, provinces, systems, fields, stats };
}
