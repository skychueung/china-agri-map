// ==========================================================================
// 中国科教机构分布地图（工B · 地图组件）
// 契约来源：contract-v2.md 工B
//   ChinaInstitutionMap({ institutions, hoveredId, selectedId, highlightedIds,
//     onHover, onSelect }: {
//       institutions: AgriculturalInstitution[];
//       hoveredId: string | null;
//       selectedId: string | null;
//       highlightedIds: string[];
//       onHover: (id: string | null) => void;
//       onSelect: (id: string) => void;
//     })
// 要点：
//   - fetch('/geojson/china.json') 模块级缓存，registerMap('china') 仅注册一次；
//   - echarts 实例只建一次，卸载 dispose；props 变化仅 setOption（replaceMerge series）；
//   - 每个出现的 MapPointCategory 一个 scatter 系列（symbol/color/size 取 POINT_CATEGORY_META）；
//   - selectedId → effectScatter 金色涟漪；highlightedIds → 1.6× + 金色描边；
//     hoveredId → 放大 + 光晕（均在数据项上动态设置）；
//   - 自定义浮层（convertToPixel 定位 + clamp + 延迟隐藏 + 移动端底部信息条）渲染 MapTooltipCard；
//   - 点击点位 onSelect，点空白不动；工具栏：重置视图 / 显示全部；
//   - geojson 失败回退（错误提示 + 按地区统计 + 重试）；ResizeObserver；roam；
//     role=img + aria-label + sr-only 机构名单。
// ==========================================================================
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import * as echarts from 'echarts';
import { AlertTriangle, ListChecks, RefreshCw, RotateCcw, X } from 'lucide-react';
import type { AgriculturalInstitution } from '../types/institution';
import { applyJitter } from '../utils/mapCoordinates';
import type { JitteredInstitution } from '../utils/mapCoordinates';
import { getPointCategory, MAP_POINT_CATEGORY_ORDER, POINT_CATEGORY_META } from '../utils/mapPointStyle';
import { MapLegend } from './MapLegend';
import { MapTooltipCard } from './MapTooltipCard';

// ──────────────────────────────────────────────────────────────────────────
// geojson 模块级缓存：全应用只请求一次；失败时清空缓存以便重试
// ──────────────────────────────────────────────────────────────────────────
type GeoJsonData = Parameters<typeof echarts.registerMap>[1];

let chinaGeoJsonPromise: Promise<GeoJsonData> | null = null;
let chinaMapRegistered = false;

function loadChinaGeoJson(): Promise<GeoJsonData> {
  if (!chinaGeoJsonPromise) {
    chinaGeoJsonPromise = fetch('/geojson/china.json').then((res) => {
      if (!res.ok) throw new Error(`china.json 请求失败（HTTP ${res.status}）`);
      return res.json() as Promise<GeoJsonData>;
    });
    // 失败时重置缓存，允许「重试」重新发起请求
    chinaGeoJsonPromise.catch(() => {
      chinaGeoJsonPromise = null;
    });
  }
  return chinaGeoJsonPromise;
}

// ──────────────────────────────────────────────────────────────────────────
// props
// ──────────────────────────────────────────────────────────────────────────
export interface ChinaInstitutionMapProps {
  institutions: AgriculturalInstitution[];
  hoveredId: string | null;
  selectedId: string | null;
  highlightedIds: string[];
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}

/** 浮层延迟隐藏时长（ms），给用户把指针移入浮层的时间 */
const TOOLTIP_HIDE_DELAY = 220;
/** 浮层与点位的偏移 / 与容器边缘的最小间距（px） */
const TOOLTIP_OFFSET = 14;
const TOOLTIP_MARGIN = 8;

/** echarts 事件参数的最小收窄结构 */
interface ChartEventLike {
  componentType?: string;
  data?: { id?: unknown };
}

function readSeriesId(params: unknown): string | null {
  const p = params as ChartEventLike;
  if (p.componentType !== 'series') return null;
  const id = p.data?.id;
  return typeof id === 'string' ? id : null;
}

export function ChinaInstitutionMap({
  institutions,
  hoveredId,
  selectedId,
  highlightedIds,
  onHover,
  onSelect,
}: ChinaInstitutionMapProps) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [retryNonce, setRetryNonce] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  const wrapperRef = useRef<HTMLDivElement | null>(null); // 地图 + 浮层的相对定位容器
  const chartDivRef = useRef<HTMLDivElement | null>(null); // echarts 挂载点
  const chartRef = useRef<echarts.ECharts | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const hideTimerRef = useRef<number | null>(null);

  // 最新回调 / 数据 ref（事件回调在实例创建时绑定一次，通过 ref 读取最新值）
  const onHoverRef = useRef(onHover);
  const onSelectRef = useRef(onSelect);
  onHoverRef.current = onHover;
  onSelectRef.current = onSelect;
  /** 事件回调在实例创建时绑定一次，isMobile 经 ref 读取最新值 */
  const isMobileRef = useRef(isMobile);
  isMobileRef.current = isMobile;

  // ── 数据加工 ──────────────────────────────────────────────────────────
  const jittered = useMemo(() => applyJitter(institutions), [institutions]);
  const jitteredById = useMemo(() => {
    const map = new Map<string, JitteredInstitution>();
    jittered.forEach((j) => map.set(j.id, j));
    return map;
  }, [jittered]);

  /** 当前数据中实际出现的点位分类（按固定顺序），图例与系列共用 */
  const categories = useMemo(() => {
    const present = new Set(jittered.map((j) => getPointCategory(j)));
    return MAP_POINT_CATEGORY_ORDER.filter((c) => present.has(c));
  }, [jittered]);

  const highlightedSet = useMemo(() => new Set(highlightedIds), [highlightedIds]);

  /** 失败回退用：按地区统计（基于全量 institutions，含坐标缺失机构） */
  const regionStats = useMemo(() => {
    const counts = new Map<string, number>();
    institutions.forEach((i) => counts.set(i.region, (counts.get(i.region) ?? 0) + 1));
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [institutions]);

  // ── 浮层显隐（延迟隐藏，允许指针移入浮层点击按钮） ──────────────────────
  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const scheduleHide = useCallback(() => {
    clearHideTimer();
    hideTimerRef.current = window.setTimeout(() => {
      hideTimerRef.current = null;
      onHoverRef.current(null);
    }, TOOLTIP_HIDE_DELAY);
  }, [clearHideTimer]);

  // ── 浮层定位（convertToPixel + clamp） ─────────────────────────────────
  const repositionTooltip = useCallback(() => {
    const chart = chartRef.current;
    const wrapper = wrapperRef.current;
    if (!chart || !wrapper || !hoveredId) {
      setTooltipPos(null);
      return;
    }
    const target = jitteredById.get(hoveredId);
    if (!target) {
      setTooltipPos(null);
      return;
    }
    const pixel = chart.convertToPixel({ geoIndex: 0 }, target.coord);
    if (!Array.isArray(pixel) || pixel.length < 2) {
      setTooltipPos(null);
      return;
    }
    const wrapRect = wrapper.getBoundingClientRect();
    const tipRect = tooltipRef.current?.getBoundingClientRect();
    const tipW = tipRect?.width ?? 320;
    const tipH = tipRect?.height ?? 220;

    let x = pixel[0] + TOOLTIP_OFFSET;
    let y = pixel[1] - tipH - TOOLTIP_OFFSET;
    x = Math.max(TOOLTIP_MARGIN, Math.min(x, wrapRect.width - tipW - TOOLTIP_MARGIN));
    y = Math.max(TOOLTIP_MARGIN, Math.min(y, wrapRect.height - tipH - TOOLTIP_MARGIN));
    setTooltipPos({ x, y });
  }, [hoveredId, jitteredById]);

  const repositionRef = useRef(repositionTooltip);
  repositionRef.current = repositionTooltip;

  useLayoutEffect(() => {
    repositionTooltip();
  }, [repositionTooltip]);

  // ── 移动端判定（底部信息条模式） ────────────────────────────────────────
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  // ── echarts 实例：只建一次（重试时重建），卸载 dispose ──────────────────
  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setErrorMessage('');

    loadChinaGeoJson()
      .then((geoJson) => {
        if (cancelled || !chartDivRef.current) return;
        if (!chinaMapRegistered) {
          echarts.registerMap('china', geoJson);
          chinaMapRegistered = true;
        }
        const chart = echarts.init(chartDivRef.current);
        chartRef.current = chart;
        // 开发环境暴露实例，供 E2E 测试按机构坐标换算屏幕像素
        if (import.meta.env.DEV) {
          (window as unknown as Record<string, unknown>).__agriMapChart = chart;
        }

        // 点击点位 → onSelect；移动端 tap 同时触发 hover，弹出底部信息条
        chart.on('click', (params: unknown) => {
          const id = readSeriesId(params);
          if (id) {
            if (isMobileRef.current) {
              clearHideTimer();
              onHoverRef.current(id);
            }
            onSelectRef.current(id);
          }
        });
        // 悬停联动（mouseover 先清隐藏定时器，mouseout 延迟隐藏）
        chart.on('mouseover', (params: unknown) => {
          const id = readSeriesId(params);
          if (id) {
            clearHideTimer();
            onHoverRef.current(id);
          }
        });
        chart.on('mouseout', (params: unknown) => {
          const id = readSeriesId(params);
          if (id) scheduleHide();
        });
        chart.on('globalout', () => scheduleHide());
        // 漫游 / 缩放后浮层跟随
        chart.on('georoam', () => repositionRef.current());

        setStatus('ready');
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setErrorMessage(err instanceof Error ? err.message : '地图数据加载失败');
        setStatus('error');
      });

    return () => {
      cancelled = true;
      clearHideTimer();
      chartRef.current?.dispose();
      chartRef.current = null;
      if (import.meta.env.DEV) {
        delete (window as unknown as Record<string, unknown>).__agriMapChart;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retryNonce, clearHideTimer, scheduleHide]);

  // ── option 构建（props 变化仅 setOption，不重建实例） ────────────────────
  const buildOption = useCallback((): echarts.EChartsCoreOption => {
    const series: Array<Record<string, unknown>> = categories.map((category) => {
      const meta = POINT_CATEGORY_META[category];
      const data = jittered
        .filter((j) => getPointCategory(j) === category)
        .map((j) => {
          const isHighlighted = highlightedSet.has(j.id);
          const isHovered = hoveredId === j.id;
          const size = meta.size * (isHovered ? 1.5 : isHighlighted ? 1.6 : 1);
          const itemStyle: Record<string, unknown> = {
            color: meta.color,
            borderColor: '#FFFFFF',
            borderWidth: 1,
          };
          if (isHighlighted) {
            // 选中总院的下属机构：金色描边（尺寸已放大 1.6×）
            itemStyle.borderColor = '#D6A84B';
            itemStyle.borderWidth = 2;
          }
          if (isHovered) {
            // 悬停：光晕
            itemStyle.shadowBlur = 12;
            itemStyle.shadowColor = 'rgba(31, 107, 69, 0.55)';
          }
          return { name: j.name, id: j.id, value: j.coord, symbolSize: size, itemStyle };
        });
      return {
        name: meta.label,
        type: 'scatter',
        coordinateSystem: 'geo',
        symbol: meta.symbol,
        symbolSize: meta.size,
        emphasis: { scale: false },
        z: 2,
        data,
      };
    });

    // 当前选中：金色涟漪 effectScatter
    const selected = selectedId ? jitteredById.get(selectedId) : undefined;
    if (selected) {
      const meta = POINT_CATEGORY_META[getPointCategory(selected)];
      series.push({
        name: '当前选中',
        type: 'effectScatter',
        coordinateSystem: 'geo',
        symbol: meta.symbol,
        symbolSize: meta.size * 1.5,
        rippleEffect: { brushType: 'stroke', color: '#D6A84B', scale: 3.2 },
        itemStyle: {
          color: meta.color,
          borderColor: '#D6A84B',
          borderWidth: 2,
          shadowBlur: 8,
          shadowColor: 'rgba(214, 168, 75, 0.7)',
        },
        z: 3,
        data: [{ name: selected.name, id: selected.id, value: selected.coord }],
      });
    }

    return {
      animationDuration: 300,
      legend: {
        top: 8,
        left: 'center',
        data: categories.map((c) => POINT_CATEGORY_META[c].label),
        itemWidth: 14,
        itemHeight: 14,
        itemGap: 14,
        textStyle: { color: '#1F2933', fontSize: 12 },
        selectedMode: true,
      },
      geo: {
        map: 'china',
        roam: true,
        scaleLimit: { min: 0.8, max: 8 },
        label: { show: false },
        itemStyle: { areaColor: '#E4EFE7', borderColor: '#A7C3B1', borderWidth: 0.6 },
        emphasis: { label: { show: false }, itemStyle: { areaColor: '#D6E7DC' } },
        select: { disabled: true },
      },
      tooltip: { show: false },
      series,
    } as echarts.EChartsCoreOption;
  }, [categories, jittered, jitteredById, highlightedSet, hoveredId, selectedId]);

  const buildOptionRef = useRef(buildOption);
  buildOptionRef.current = buildOption;

  // props / 数据变化 → 仅 setOption（series 整体替换以应对筛选后系列数量变化）
  useEffect(() => {
    if (status !== 'ready' || !chartRef.current) return;
    chartRef.current.setOption(buildOption(), { replaceMerge: ['series'] });
  }, [status, buildOption]);

  // ── ResizeObserver：容器尺寸变化时 resize 并重定位浮层 ──────────────────
  useEffect(() => {
    if (status !== 'ready') return;
    const el = chartDivRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      chartRef.current?.resize();
      repositionRef.current();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [status]);

  // ── 工具栏动作 ──────────────────────────────────────────────────────────
  /** 重置视图：notMerge 全量重建 option，geo 回到默认适配视野 */
  const resetView = useCallback(() => {
    chartRef.current?.setOption(buildOptionRef.current(), { notMerge: true });
  }, []);

  /** 显示全部：重置缩放 + 清 hover + onSelect('') 清选中 */
  const showAll = useCallback(() => {
    resetView();
    clearHideTimer();
    onHoverRef.current(null);
    onSelectRef.current('');
  }, [resetView, clearHideTimer]);

  const retry = useCallback(() => setRetryNonce((n) => n + 1), []);

  // ── 浮层目标机构（坐标缺失的机构无法在图上定位，不显示浮层） ─────────────
  const hoveredInstitution = hoveredId ? jitteredById.get(hoveredId) : undefined;

  // 地图内「查看所属体系」回退：选中其上级机构（地图上下文内的合理行为；
  // 跳转 #hierarchy 的完整联动由集成层通过卡片/树组件承接，见交接说明）
  const handleViewSystem = useCallback((systemId: string) => {
    onSelectRef.current(systemId);
  }, []);

  // ── 渲染 ────────────────────────────────────────────────────────────────
  return (
    <section id="map" aria-labelledby="china-map-title" className="scroll-mt-20 py-10">
      <header className="mx-auto mb-6 max-w-3xl px-4 text-center">
        <h2 id="china-map-title" className="text-2xl font-bold text-agri-text md:text-3xl">
          中国农业科教机构分布地图
        </h2>
        <p className="mt-2 text-sm text-agri-muted">
          点位形状与颜色区分机构类型，金色涟漪标记当前选中机构；拖拽漫游、滚轮缩放，点击点位查看详情。
        </p>
      </header>

      <div className="mx-auto max-w-6xl px-4">
        <div className="rounded-2xl bg-white p-4 shadow-md transition-all duration-300 md:p-6">
          {status === 'error' ? (
            // ── 失败回退：错误提示 + 按地区统计 + 重试 ──
            <div
              role="alert"
              className="flex flex-col items-center rounded-xl bg-agri-bg px-6 py-10 text-center"
            >
              <AlertTriangle className="h-10 w-10 text-agri-accent" aria-hidden="true" />
              <p className="mt-3 text-base font-semibold text-agri-text">地图底图加载失败</p>
              <p className="mt-1 text-sm text-agri-muted">
                {errorMessage || '网络异常，无法获取地图数据。'}请检查网络后重试；以下为当前机构的地区分布统计。
              </p>
              <button
                type="button"
                onClick={retry}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-agri-primary px-4 py-2 text-sm font-medium text-white transition-all duration-300 hover:bg-agri-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-agri-primary focus-visible:ring-offset-2"
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                重试
              </button>
              <div className="mt-6 w-full">
                <h3 className="text-sm font-semibold text-agri-text">按地区统计（共 {institutions.length} 个机构）</h3>
                <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {regionStats.map(([region, count]) => (
                    <li key={region} className="rounded-lg bg-white px-3 py-2 shadow-xs">
                      <span className="block text-xs text-agri-muted">{region}</span>
                      <span className="block text-lg font-semibold text-agri-primary">{count}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <>
              <div ref={wrapperRef} className="relative">
                {/* echarts 挂载点：role=img + aria-label 描述地图内容 */}
                <div
                  ref={chartDivRef}
                  role="img"
                  aria-label={`中国农业科教机构分布地图，当前显示 ${jittered.length} 个机构点位，共 ${institutions.length} 个机构`}
                  className="h-[420px] w-full rounded-xl bg-agri-map md:h-[560px]"
                />

                {status === 'loading' && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-agri-map">
                    <p className="animate-pulse text-sm text-agri-muted">地图加载中…</p>
                  </div>
                )}

                {/* 工具栏 */}
                {status === 'ready' && (
                  <div className="absolute right-3 top-3 z-10 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={resetView}
                      aria-label="重置视图"
                      title="重置视图"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-white/95 px-3 py-1.5 text-xs font-medium text-agri-text shadow-md transition-all duration-300 hover:bg-agri-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-agri-primary focus-visible:ring-offset-2"
                    >
                      <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                      重置视图
                    </button>
                    <button
                      type="button"
                      onClick={showAll}
                      aria-label="显示全部机构"
                      title="显示全部机构"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-white/95 px-3 py-1.5 text-xs font-medium text-agri-text shadow-md transition-all duration-300 hover:bg-agri-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-agri-primary focus-visible:ring-offset-2"
                    >
                      <ListChecks className="h-3.5 w-3.5" aria-hidden="true" />
                      显示全部
                    </button>
                  </div>
                )}

                {/* 桌面端：自定义浮层（clamp 定位 + 延迟隐藏） */}
                {status === 'ready' && !isMobile && hoveredInstitution && (
                  <div
                    ref={tooltipRef}
                    className="absolute z-20"
                    style={{
                      left: tooltipPos?.x ?? -9999,
                      top: tooltipPos?.y ?? -9999,
                    }}
                    onMouseEnter={clearHideTimer}
                    onMouseLeave={scheduleHide}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') onHoverRef.current(null);
                    }}
                  >
                    <MapTooltipCard institution={hoveredInstitution} onViewSystem={handleViewSystem} />
                  </div>
                )}

                {/* 移动端：底部信息条 */}
                {status === 'ready' && isMobile && hoveredInstitution && (
                  <div className="absolute inset-x-2 bottom-2 z-20">
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => onHoverRef.current(null)}
                        aria-label="关闭机构信息"
                        className="absolute -right-2 -top-2 z-10 rounded-full bg-white p-1 text-agri-muted shadow-md transition-all duration-300 hover:text-agri-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-agri-primary"
                      >
                        <X className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <MapTooltipCard institution={hoveredInstitution} onViewSystem={handleViewSystem} />
                    </div>
                  </div>
                )}
              </div>

              {/* 图例（形状 + 文字，不只靠颜色） */}
              <div className="mt-4 border-t border-gray-100 pt-3">
                <MapLegend categories={categories} />
              </div>
            </>
          )}
        </div>
      </div>

      {/* 屏幕阅读器用机构名单 */}
      <ul className="sr-only">
        {institutions.map((inst) => (
          <li key={inst.id}>
            {inst.name}，{inst.province}
            {inst.city}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default ChinaInstitutionMap;
