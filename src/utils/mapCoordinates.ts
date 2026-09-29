// ==========================================================================
// 地图坐标抖动工具（工B · 地图组件）
// 契约来源：contract-v2.md 工B 任务
//   applyJitter(list: AgriculturalInstitution[]):
//     Array<AgriculturalInstitution & { coord: [number, number] }>
//   - 过滤 null 经纬度
//   - 同城 或 距离 < 0.3° 聚合为一个簇
//   - 簇内环形确定性偏移：半径 0.35° 起、每多 1 所 +0.07°，
//     角度按 id 排序均分，经度偏移按 cos(lat) 修正
// ==========================================================================
import type { AgriculturalInstitution } from '../types/institution';

/** 带地图坐标（[经度, 纬度]）的机构记录 */
export type JitteredInstitution = AgriculturalInstitution & { coord: [number, number] };

/** 聚合判定阈值（度）：与簇中心距离小于该值即归入该簇 */
const CLUSTER_DISTANCE_DEG = 0.3;
/** 环形偏移基准半径（度） */
const BASE_RADIUS_DEG = 0.35;
/** 簇内每多 1 所机构增加的半径（度） */
const RADIUS_STEP_DEG = 0.07;
/** 高纬度 cos(lat) 修正的保护下限，避免除零 */
const MIN_COS_LAT = 1e-6;

/** 有有效经纬度的机构（过滤 null 后的收窄类型） */
type LocatedInstitution = AgriculturalInstitution & { latitude: number; longitude: number };

function hasValidCoord(inst: AgriculturalInstitution): inst is LocatedInstitution {
  return typeof inst.latitude === 'number' && typeof inst.longitude === 'number';
}

/** 同城判定键：省 + 市 */
function cityKey(inst: AgriculturalInstitution): string {
  return `${inst.province}|${inst.city}`;
}

interface Cluster {
  /** 簇内已出现的城市键（同城归并用） */
  cityKeys: Set<string>;
  sumLat: number;
  sumLng: number;
  /** 簇成员，始终保持按 id 升序（输入已排序，贪心追加不打乱） */
  members: LocatedInstitution[];
}

/**
 * 为重叠/邻近的机构点位生成确定性环形偏移坐标。
 *
 * 算法：
 * 1. 过滤 latitude/longitude 为 null 的机构；
 * 2. 按 id 升序排序后贪心聚合——同城（省+市相同）或与簇中心
 *    欧氏距离 < 0.3° 即归入已有簇，否则新建簇（排序保证结果确定）；
 * 3. 单成员簇保持原始坐标；多成员簇以簇中心为圆心做环形均分布点：
 *    半径 = 0.35° + (n - 1) × 0.07°，第 i 个成员（按 id 排序）
 *    角度 = 2π·i/n，经度方向偏移除以 cos(中心纬度) 修正投影变形。
 */
export function applyJitter(list: AgriculturalInstitution[]): JitteredInstitution[] {
  const located = list.filter(hasValidCoord).sort((a, b) => a.id.localeCompare(b.id));

  // ── 贪心聚合 ──────────────────────────────────────────────────────────
  const clusters: Cluster[] = [];
  for (const inst of located) {
    let target: Cluster | null = null;
    for (const cluster of clusters) {
      const centerLat = cluster.sumLat / cluster.members.length;
      const centerLng = cluster.sumLng / cluster.members.length;
      const sameCity = cluster.cityKeys.has(cityKey(inst));
      const distance = Math.hypot(inst.latitude - centerLat, inst.longitude - centerLng);
      if (sameCity || distance < CLUSTER_DISTANCE_DEG) {
        target = cluster;
        break;
      }
    }
    if (!target) {
      target = { cityKeys: new Set<string>(), sumLat: 0, sumLng: 0, members: [] };
      clusters.push(target);
    }
    target.cityKeys.add(cityKey(inst));
    target.sumLat += inst.latitude;
    target.sumLng += inst.longitude;
    target.members.push(inst);
  }

  // ── 环形确定性偏移 ────────────────────────────────────────────────────
  const result: JitteredInstitution[] = [];
  for (const cluster of clusters) {
    if (cluster.members.length === 1) {
      const only = cluster.members[0];
      result.push({ ...only, coord: [only.longitude, only.latitude] });
      continue;
    }
    const n = cluster.members.length;
    const centerLat = cluster.sumLat / n;
    const centerLng = cluster.sumLng / n;
    const radius = BASE_RADIUS_DEG + (n - 1) * RADIUS_STEP_DEG;
    const cosLat = Math.max(Math.cos((centerLat * Math.PI) / 180), MIN_COS_LAT);

    cluster.members.forEach((inst, index) => {
      const angle = (2 * Math.PI * index) / n;
      const latOffset = radius * Math.sin(angle);
      const lngOffset = (radius * Math.cos(angle)) / cosLat;
      result.push({ ...inst, coord: [centerLng + lngOffset, centerLat + latOffset] });
    });
  }
  return result;
}
