// ==========================================================================
// 地图点位图例（工B · 地图组件）
// 契约来源：contract-v2.md 工B
//   MapLegend({ categories }: { categories: MapPointCategory[] })
// 每一类用内联 SVG 绘制对应形状（圆/六边形/菱形/方形/三角/小点）+ 中文标签，
// 形状 + 文字 + 颜色三重编码，不只靠颜色传达类型。
// ==========================================================================
import type { ReactNode } from 'react';
import type { MapPointCategory } from '../types/institution';
import { POINT_CATEGORY_META } from '../utils/mapPointStyle';

export interface MapLegendProps {
  categories: MapPointCategory[];
}

/** 单个分类的内联 SVG 形状示意（18×18，白色描边与地图点位一致） */
function CategoryGlyph({ category }: { category: MapPointCategory }) {
  const meta = POINT_CATEGORY_META[category];
  const common = {
    fill: meta.color,
    stroke: '#FFFFFF',
    strokeWidth: 1.2,
  } as const;

  let shape: ReactNode;
  switch (category) {
    case 'national_academy':
      // 平顶六边形（外接圆半径 6.4，圆心 10,10）
      shape = (
        <polygon
          points="16.4,10 13.2,15.54 6.8,15.54 3.6,10 6.8,4.46 13.2,4.46"
          {...common}
          stroke="#B98A2E"
        />
      );
      break;
    case 'national_institute':
      // 菱形
      shape = <polygon points="10,2.8 17.2,10 10,17.2 2.8,10" {...common} />;
      break;
    case 'provincial_academy':
      // 方形（微圆角）
      shape = <rect x="4" y="4" width="12" height="12" rx="2" {...common} />;
      break;
    case 'provincial_institute':
      // 三角形
      shape = <polygon points="10,3.4 17,15.6 3,15.6" {...common} />;
      break;
    case 'municipal':
      // 灰绿小圆点
      shape = <circle cx="10" cy="10" r="3.2" {...common} />;
      break;
    case 'university_vocational':
      // 浅绿圆形（略小）
      shape = <circle cx="10" cy="10" r="5.4" {...common} />;
      break;
    case 'university_bachelor':
    default:
      // 绿色圆形
      shape = <circle cx="10" cy="10" r="6" {...common} />;
      break;
  }

  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 20 20"
      aria-hidden="true"
      focusable="false"
      className="shrink-0"
    >
      {shape}
    </svg>
  );
}

/**
 * 地图图例：仅渲染传入 categories 中出现的分类。
 * 形状（svg）+ 文字标签并存，满足「不只靠颜色」的无障碍要求。
 */
export function MapLegend({ categories }: MapLegendProps) {
  if (categories.length === 0) return null;

  return (
    <ul
      aria-label="地图点位图例"
      className="flex flex-wrap items-center gap-x-4 gap-y-2"
    >
      {categories.map((category) => (
        <li key={category} className="flex items-center gap-1.5">
          <CategoryGlyph category={category} />
          <span className="text-xs text-agri-text">{POINT_CATEGORY_META[category].label}</span>
        </li>
      ))}
    </ul>
  );
}

export default MapLegend;
