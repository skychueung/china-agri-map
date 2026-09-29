// ==========================================================================
// InstitutionGrid —— 机构卡片网格（工D）
// 契约来源：contract-v2.md「工D」一节，props 签名逐字遵守
// 按 institutionKind 自动选用 UniversityCard / ResearchInstituteCard；
// 空结果显示 EmptyState。
// ==========================================================================
import type { AgriculturalInstitution } from '../types/institution';
import { UniversityCard } from './UniversityCard';
import { ResearchInstituteCard } from './ResearchInstituteCard';
import { EmptyState } from './EmptyState';

export interface InstitutionGridProps {
  title: string;
  id: string;
  institutions: AgriculturalInstitution[];
  hoveredId: string | null;
  selectedId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
  onLocate: (id: string) => void;
  onViewSystem: (systemId: string) => void;
  emptyOnReset: () => void;
}

export function InstitutionGrid({
  title,
  id,
  institutions,
  hoveredId,
  selectedId,
  onHover,
  onSelect,
  onLocate,
  onViewSystem,
  emptyOnReset,
}: InstitutionGridProps) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-20">
      <div className="mb-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 id={`${id}-title`} className="text-2xl font-bold text-agri-text">
          {title}
        </h2>
        <p className="text-sm text-agri-muted" aria-live="polite">
          共 {institutions.length} 个机构
        </p>
      </div>

      {institutions.length === 0 ? (
        <EmptyState onReset={emptyOnReset} />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {institutions.map((inst) =>
            inst.institutionKind === 'university' ? (
              <UniversityCard
                key={inst.id}
                university={inst}
                highlighted={hoveredId === inst.id}
                selected={selectedId === inst.id}
                onHover={onHover}
                onSelect={onSelect}
                onLocate={onLocate}
              />
            ) : (
              <ResearchInstituteCard
                key={inst.id}
                institute={inst}
                highlighted={hoveredId === inst.id}
                selected={selectedId === inst.id}
                onHover={onHover}
                onSelect={onSelect}
                onLocate={onLocate}
                onViewSystem={onViewSystem}
              />
            ),
          )}
        </div>
      )}
    </section>
  );
}

export default InstitutionGrid;
