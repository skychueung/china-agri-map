// ==========================================================================
// 地图与体系联动选中状态 Hook（工E · 科研体系组件）
// 契约来源：contract-v2.md「工具与 Hook」一节
//   useMapSelection() → { selectedId, hoveredId, select, hover,
//                         expandedSystemId, expandSystem }
// ==========================================================================
import { useCallback, useState } from 'react';

export interface MapSelection {
  /** 当前选中机构 id（地图涟漪 / 卡片高亮共用） */
  selectedId: string | null;
  /** 当前悬停机构 id */
  hoveredId: string | null;
  /** 选中/取消选中机构 */
  select: (id: string | null) => void;
  /** 悬停/取消悬停机构 */
  hover: (id: string | null) => void;
  /** 科研体系浏览中当前展开的总院 id（受控展开，单面板手风琴） */
  expandedSystemId: string | null;
  /** 展开/收起某个总院体系面板 */
  expandSystem: (id: string | null) => void;
}

export function useMapSelection(): MapSelection {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [expandedSystemId, setExpandedSystemId] = useState<string | null>(null);

  const select = useCallback((id: string | null) => {
    setSelectedId(id);
  }, []);

  const hover = useCallback((id: string | null) => {
    setHoveredId(id);
  }, []);

  const expandSystem = useCallback((id: string | null) => {
    setExpandedSystemId(id);
  }, []);

  return { selectedId, hoveredId, select, hover, expandedSystemId, expandSystem };
}
