// ==========================================================================
// UniversityCard —— 农业院校卡片（工D）
// 契约来源：contract-v2.md「工D」一节，props 签名逐字遵守
// 交互：hover/focus-within 展开详情（移动端常显）；Enter/Space 触发 onSelect；
//       内部按钮 stopPropagation；占位图 onError 兜底
// ==========================================================================
import { ExternalLink, MapPin } from 'lucide-react';
import type { AgriculturalInstitution, InstitutionLevel } from '../types/institution';

const LOGO_PLACEHOLDER = '/placeholders/logo.svg';
const CAMPUS_PLACEHOLDER = '/placeholders/campus.svg';

const LEVEL_LABEL: Record<InstitutionLevel, string> = {
  national: '国家级',
  provincial: '省级',
  municipal: '地市级',
  regional: '区域级',
};

/** 图片加载失败兜底：回退到占位图，且避免占位图本身加载失败造成死循环 */
function fallbackSrc(img: HTMLImageElement, placeholder: string) {
  if (!img.src.endsWith(placeholder)) {
    img.src = placeholder;
  }
}

export interface UniversityCardProps {
  university: AgriculturalInstitution;
  highlighted: boolean;
  selected: boolean;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
  onLocate: (id: string) => void;
}

export function UniversityCard({
  university,
  highlighted,
  selected,
  onHover,
  onSelect,
  onLocate,
}: UniversityCardProps) {
  const {
    id,
    name,
    shortName,
    province,
    city,
    logo,
    image,
    description,
    researchFields,
    educationLevel,
    institutionLevel,
    website,
    websiteStatus,
  } = university;

  const active = selected || highlighted;
  const fields = researchFields ?? [];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(id);
    }
  };

  return (
    <article
      id={`card-${id}`}
      tabIndex={0}
      aria-label={`${name}，${province}${city}`}
      className={[
        'group flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm',
        'transition-all duration-300',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-agri-primary focus-visible:ring-offset-2',
        active
          ? '-translate-y-1 border-agri-primary shadow-lg'
          : 'border-agri-map hover:-translate-y-1 hover:border-agri-primary hover:shadow-lg',
      ].join(' ')}
      onMouseEnter={() => onHover(id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onSelect(id)}
      onKeyDown={handleKeyDown}
    >
      {/* ── 默认区（常显） ─────────────────────────────────────────── */}
      <div className="flex items-start gap-3 p-5">
        <img
          src={logo || LOGO_PLACEHOLDER}
          alt={`${name}校徽`}
          loading="lazy"
          className="h-14 w-14 shrink-0 rounded-full border border-agri-map bg-agri-bg object-contain p-1"
          onError={(e) => fallbackSrc(e.currentTarget, LOGO_PLACEHOLDER)}
        />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-agri-text">{name}</h3>
          {shortName && <p className="mt-0.5 text-xs text-agri-muted">简称：{shortName}</p>}
          <p className="mt-1 flex items-center gap-1 text-sm text-agri-muted">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {province} · {city}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 px-5 pb-4">
        {/* 徽章同时携带文字，不只靠颜色区分 */}
        {educationLevel && (
          <span className="rounded-full bg-agri-primary/10 px-2.5 py-0.5 text-xs font-medium text-agri-primary">
            {educationLevel}
          </span>
        )}
        <span
          className={
            institutionLevel === 'national'
              ? 'rounded-full bg-agri-accent/15 px-2.5 py-0.5 text-xs font-medium text-agri-text'
              : 'rounded-full bg-agri-secondary/15 px-2.5 py-0.5 text-xs font-medium text-agri-secondary'
          }
        >
          {LEVEL_LABEL[institutionLevel]}
        </span>
        {fields.slice(0, 2).map((f) => (
          <span
            key={f}
            className="rounded-full bg-agri-bg px-2.5 py-0.5 text-xs text-agri-muted"
          >
            {f}
          </span>
        ))}
      </div>

      {/* ── 展开区：移动端常显，md 起 hover/focus-within 展开 ────────── */}
      <div
        className={[
          'overflow-hidden transition-all duration-300',
          'max-h-[520px] opacity-100',
          'md:max-h-0 md:opacity-0',
          'md:group-hover:max-h-[520px] md:group-hover:opacity-100',
          'md:group-focus-within:max-h-[520px] md:group-focus-within:opacity-100',
        ].join(' ')}
      >
        <div className="border-t border-agri-map px-5 pb-5 pt-4">
          <img
            src={image || CAMPUS_PLACEHOLDER}
            alt={`${name}校园示意`}
            loading="lazy"
            className="aspect-video w-full rounded-xl border border-agri-map bg-agri-bg object-cover"
            onError={(e) => fallbackSrc(e.currentTarget, CAMPUS_PLACEHOLDER)}
          />
          <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-agri-muted">
            {description}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {websiteStatus === 'verified' && website ? (
              <a
                href={website}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`访问${name}官网（新窗口打开）`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-agri-primary px-3.5 py-2 text-sm font-medium text-white transition-all duration-300 hover:bg-agri-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-agri-primary focus-visible:ring-offset-2"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              >
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                访问官网
              </a>
            ) : (
              <button
                type="button"
                disabled
                aria-label={
                  websiteStatus === 'pending'
                    ? `${name}官网待核实`
                    : `${name}官网暂时不可用`
                }
                className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-lg bg-agri-bg px-3.5 py-2 text-sm font-medium text-agri-muted"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              >
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                {websiteStatus === 'pending' ? '官网待核实' : '官网暂时不可用'}
              </button>
            )}
            <button
              type="button"
              aria-label={`在地图上定位${name}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-agri-primary px-3.5 py-2 text-sm font-medium text-agri-primary transition-all duration-300 hover:bg-agri-primary hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-agri-primary focus-visible:ring-offset-2"
              onClick={(e) => {
                e.stopPropagation();
                onLocate(id);
              }}
              onKeyDown={(e) => e.stopPropagation()}
            >
              <MapPin className="h-4 w-4" aria-hidden="true" />
              地图定位
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export default UniversityCard;
