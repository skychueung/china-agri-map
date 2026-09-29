// ==========================================================================
// 机构体系树构建工具（工E · 科研体系组件）
// 契约来源：contract-v2.md「工具与 Hook」一节
//   - 根 = 无 parentInstitutionId，或 parentInstitutionId 不在传入 list 中
//   - 排序 = featured 优先，其后按 name.localeCompare(zh) 升序
// ==========================================================================
import type { AgriculturalInstitution } from '../types/institution';

export interface InstitutionTreeNode {
  institution: AgriculturalInstitution;
  children: InstitutionTreeNode[];
}

/** 节点排序：featured 优先，其余按中文名称排序 */
function compareNodes(a: InstitutionTreeNode, b: InstitutionTreeNode): number {
  const fa = a.institution.featured ? 1 : 0;
  const fb = b.institution.featured ? 1 : 0;
  if (fa !== fb) return fb - fa;
  return a.institution.name.localeCompare(b.institution.name, 'zh');
}

/**
 * 将扁平机构列表构建为树。
 * - parentInstitutionId 存在于 list 中才挂接为子节点，否则视为根节点
 *   （数据集中水科院/林科院/青海省农林科学院的上级在数据集外，按根处理）。
 * - 每一层 children 均按 featured 优先 + 中文名称排序。
 */
export function buildInstitutionTree(
  list: AgriculturalInstitution[],
): InstitutionTreeNode[] {
  const nodes = new Map<string, InstitutionTreeNode>();
  for (const institution of list) {
    nodes.set(institution.id, { institution, children: [] });
  }

  const roots: InstitutionTreeNode[] = [];
  for (const node of nodes.values()) {
    const parentId = node.institution.parentInstitutionId;
    const parent = parentId ? nodes.get(parentId) : undefined;
    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortRecursive = (items: InstitutionTreeNode[]): void => {
    items.sort(compareNodes);
    for (const item of items) sortRecursive(item.children);
  };
  sortRecursive(roots);

  return roots;
}

/** 在树（森林）中按机构 id 查找节点，未找到返回 null */
export function findInstitutionTreeNode(
  roots: InstitutionTreeNode[],
  id: string,
): InstitutionTreeNode | null {
  for (const root of roots) {
    if (root.institution.id === id) return root;
    const hit = findInstitutionTreeNode(root.children, id);
    if (hit) return hit;
  }
  return null;
}

/** 收集节点的全部后代机构 id（不含节点自身），用于地图高亮等联动 */
export function collectDescendantIds(node: InstitutionTreeNode): string[] {
  const ids: string[] = [];
  const walk = (current: InstitutionTreeNode): void => {
    for (const child of current.children) {
      ids.push(child.institution.id);
      walk(child);
    }
  };
  walk(node);
  return ids;
}
