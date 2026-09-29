// ==========================================================================
// 机构体系树组件（工E · 科研体系组件）
// 契约来源：contract-v2.md「组件契约 · 工E」
//   InstitutionTree({ node, selectedId, expandedIds, onSelect, onToggle })
//   递归树；节点显示名称 + 级别徽章 + 下属计数；选中高亮；按钮 aria-expanded。
// ==========================================================================
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { InstitutionLevel } from '../types/institution';
import type { InstitutionTreeNode } from '../utils/buildInstitutionTree';

/** 机构级别 → 徽章文案（文字 + 颜色双重传达，不只依赖颜色） */
const LEVEL_BADGE: Record<InstitutionLevel, { label: string; className: string }> = {
  national: {
    label: '国家级',
    className: 'bg-agri-accent/15 text-agri-accent border-agri-accent/40',
  },
  provincial: {
    label: '省级',
    className: 'bg-agri-primary/10 text-agri-primary border-agri-primary/30',
  },
  municipal: {
    label: '地市级',
    className: 'bg-agri-secondary/10 text-agri-secondary border-agri-secondary/30',
  },
  regional: {
    label: '区域性',
    className: 'bg-agri-muted/10 text-agri-muted border-agri-muted/30',
  },
};

export interface InstitutionTreeProps {
  node: InstitutionTreeNode;
  selectedId: string | null;
  expandedIds: Set<string>;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
  /** 内部递归用：当前层级（0 = 根），用于 pl-4 逐级缩进 */
  depth?: number;
}

export function InstitutionTree({
  node,
  selectedId,
  expandedIds,
  onSelect,
  onToggle,
  depth = 0,
}: InstitutionTreeProps) {
  const { institution, children } = node;
  const hasChildren = children.length > 0;
  const isExpanded = expandedIds.has(institution.id);
  const isSelected = selectedId === institution.id;
  const badge = LEVEL_BADGE[institution.institutionLevel];

  return (
    <div role="treeitem" aria-expanded={hasChildren ? isExpanded : undefined} aria-selected={isSelected}>
      {/* 节点行：展开箭头 + 名称 + 级别徽章 + 下属计数 */}
      <div
        className={`flex items-center gap-1 rounded-r-lg border-l-4 py-1 pr-2 transition-all duration-300 ${
          isSelected
            ? 'border-agri-primary bg-agri-bg'
            : 'border-transparent hover:bg-agri-bg/60'
        }`}
        style={{ paddingLeft: `${depth * 1 + 0.25}rem` }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => onToggle(institution.id)}
            aria-expanded={isExpanded}
            aria-label={`${isExpanded ? '收起' : '展开'}${institution.name}的 ${children.length} 个下属机构`}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-agri-muted transition-all duration-300 hover:bg-agri-primary/10 hover:text-agri-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-agri-primary"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            ) : (
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        ) : (
          /* 无子节点时占位对齐，保持名称左对齐 */
          <span className="h-7 w-7 shrink-0" aria-hidden="true" />
        )}

        <button
          type="button"
          onClick={() => onSelect(institution.id)}
          aria-label={`在地图与卡片中定位：${institution.name}`}
          aria-current={isSelected ? 'true' : undefined}
          className={`flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1 text-left text-sm transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-agri-primary ${
            isSelected
              ? 'font-semibold text-agri-primary'
              : 'text-agri-text hover:text-agri-primary'
          }`}
        >
          <span className="truncate">{institution.name}</span>
          <span
            className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] leading-none ${badge.className}`}
          >
            {badge.label}
          </span>
          {hasChildren && (
            <span
              className="shrink-0 rounded-full bg-agri-primary/10 px-1.5 py-0.5 text-[10px] leading-none text-agri-primary"
              aria-label={`共 ${children.length} 个下属机构`}
            >
              {children.length} 个下属
            </span>
          )}
        </button>
      </div>

      {/* 子节点（递归，缩进随 depth 递增） */}
      {hasChildren && isExpanded && (
        <div role="group" aria-label={`${institution.name}的下属机构`}>
          {children.map((child) => (
            <InstitutionTree
              key={child.institution.id}
              node={child}
              selectedId={selectedId}
              expandedIds={expandedIds}
              onSelect={onSelect}
              onToggle={onToggle}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default InstitutionTree;
