// ==========================================================================
// 地图自定义浮层卡片（工B · 地图组件）
// 契约来源：contract-v2.md 工B
//   MapTooltipCard({ institution, onViewSystem }: {
//     institution: AgriculturalInstitution;
//     onViewSystem?: (systemId: string) => void;
//   })
// 内容：名称/简称/类型级别徽章/省市/上级机构行（有 parentInstitutionName 才显示）/
//   研究领域前 3 标签/简介 line-clamp-2/「访问官网」三态/「查看所属体系」按钮
//   （有 parentInstitutionId 才显示，点击 onViewSystem?.(parentInstitutionId)）。
// ==========================================================================
import { Building2, ExternalLink, MapPin, Network } from 'lucide-react';
import type { AgriculturalInstitution } from '../types/institution';
import { getPointCategory, POINT_CATEGORY_META } from '../utils/mapPointStyle';

export interface MapTooltipCardProps {
  institution: AgriculturalInstitution;
  onViewSystem?: (systemId: string) => void;
}

/** 「访问官网」按 websiteStatus 三态渲染 */
function WebsiteAction({ institution }: { institution: AgriculturalInstitution }) {
  const baseClass =
    'inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-300';

  if (institution.websiteStatus === 'verified' && institution.website) {
    return (
      <a
        href={institution.website}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`访问${institution.name}官网（新窗口打开）`}
        className={`${baseClass} bg-agri-primary text-white hover:bg-agri-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-agri-primary focus-visible:ring-offset-2`}
      >
        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        访问官网
      </a>
    );
  }

  const disabledText =
    institution.websiteStatus === 'pending' ? '官网待核实' : '官网不可用';
  return (
    <span
      aria-disabled="true"
      title={disabledText}
      className={`${baseClass} cursor-not-allowed bg-gray-100 text-agri-muted`}
    >
      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
      {disabledText}
    </span>
  );
}

export function MapTooltipCard({ institution, onViewSystem }: MapTooltipCardProps) {
  const categoryMeta = POINT_CATEGORY_META[getPointCategory(institution)];
  const fields = (institution.researchFields ?? []).slice(0, 3);
  const extraFieldCount = Math.max((institution.researchFields ?? []).length - 3, 0);

  return (
    <div
      role="dialog"
      aria-label={`${institution.name}简介`}
      className="w-72 rounded-2xl border border-gray-100 bg-white p-4 shadow-lg transition-all duration-300 sm:w-80"
    >
      {/* 名称 + 简称 + 类型级别徽章 */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold leading-5 text-agri-text">
          {institution.name}
          {institution.shortName && (
            <span className="ml-1.5 text-xs font-normal text-agri-muted">
              （{institution.shortName}）
            </span>
          )}
        </h3>
        <span
          className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium text-white"
          style={{ backgroundColor: categoryMeta.color }}
        >
          {categoryMeta.label}
        </span>
      </div>

      {/* 省市 */}
      <p className="mt-2 flex items-center gap-1 text-xs text-agri-muted">
        <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        {institution.province} · {institution.city}
      </p>

      {/* 上级机构（有才显示） */}
      {institution.parentInstitutionName && (
        <p className="mt-1 flex items-center gap-1 text-xs text-agri-muted">
          <Building2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          上级机构：{institution.parentInstitutionName}
        </p>
      )}

      {/* 研究领域（前 3 个） */}
      {fields.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {fields.map((field) => (
            <span
              key={field}
              className="rounded-full bg-agri-bg px-2 py-0.5 text-[11px] text-agri-primary"
            >
              {field}
            </span>
          ))}
          {extraFieldCount > 0 && (
            <span className="text-[11px] text-agri-muted">+{extraFieldCount}</span>
          )}
        </div>
      )}

      {/* 简介（两行截断） */}
      <p className="mt-2 line-clamp-2 text-xs leading-5 text-agri-muted">
        {institution.description}
      </p>

      {/* 操作区 */}
      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
        <WebsiteAction institution={institution} />
        {institution.parentInstitutionId && (
          <button
            type="button"
            onClick={() => onViewSystem?.(institution.parentInstitutionId as string)}
            aria-label={`查看${institution.name}所属体系`}
            className="inline-flex items-center gap-1 rounded-lg border border-agri-primary/30 bg-white px-3 py-1.5 text-xs font-medium text-agri-primary transition-all duration-300 hover:bg-agri-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-agri-primary focus-visible:ring-offset-2"
          >
            <Network className="h-3.5 w-3.5" aria-hidden="true" />
            查看所属体系
          </button>
        )}
      </div>
    </div>
  );
}

export default MapTooltipCard;
