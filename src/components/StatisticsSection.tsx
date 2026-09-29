import {
  BadgeCheck,
  Beef,
  Building,
  Building2,
  FlaskConical,
  Landmark,
  MapPin,
  Microscope,
  School,
  Wheat,
  type LucideIcon,
} from 'lucide-react';
import type { InstitutionStats } from '../types/institution';

/**
 * StatisticsSection —— 统计总览
 * 契约：contract-v2.md「工A」
 * StatisticsSection({ stats }: { stats: InstitutionStats })，10 张统计卡，响应式 5/3/2 列
 */

interface StatCardDef {
  label: string;
  value: keyof InstitutionStats;
  icon: LucideIcon;
  iconClass: string;
  bgClass: string;
}

const STAT_CARDS: StatCardDef[] = [
  { label: '农业院校总数', value: 'universityTotal', icon: School, iconClass: 'text-agri-primary', bgClass: 'bg-agri-primary/10' },
  { label: '科研机构总数', value: 'researchTotal', icon: FlaskConical, iconClass: 'text-agri-secondary', bgClass: 'bg-agri-secondary/10' },
  { label: '国家级科研总院', value: 'nationalAcademies', icon: Landmark, iconClass: 'text-agri-accent', bgClass: 'bg-agri-accent/15' },
  { label: '国家级专业研究所', value: 'nationalInstitutes', icon: Microscope, iconClass: 'text-[#E08A3C]', bgClass: 'bg-[#E08A3C]/10' },
  { label: '省级综合农科院', value: 'provincialAcademies', icon: Building, iconClass: 'text-[#2E8B7A]', bgClass: 'bg-[#2E8B7A]/10' },
  { label: '省级专业研究所', value: 'provincialInstitutes', icon: Building2, iconClass: 'text-[#3FB8C4]', bgClass: 'bg-[#3FB8C4]/10' },
  { label: '覆盖省份', value: 'provinces', icon: MapPin, iconClass: 'text-agri-primary', bgClass: 'bg-agri-primary/10' },
  { label: '官网已核实', value: 'verifiedWebsites', icon: BadgeCheck, iconClass: 'text-agri-secondary', bgClass: 'bg-agri-secondary/10' },
  { label: '畜牧兽医类机构', value: 'veterinaryRelated', icon: Beef, iconClass: 'text-[#B4762F]', bgClass: 'bg-agri-accent/15' },
  { label: '作物与植保类机构', value: 'cropAndPlantProtection', icon: Wheat, iconClass: 'text-agri-primary', bgClass: 'bg-agri-primary/10' },
];

export default function StatisticsSection({ stats }: { stats: InstitutionStats }) {
  return (
    <section className="bg-agri-bg py-12 sm:py-16" aria-labelledby="statistics-title">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h2 id="statistics-title" className="text-2xl font-bold text-agri-text sm:text-3xl">
            数据总览
          </h2>
          <p className="mt-2 text-sm text-agri-muted sm:text-base">
            首批收录机构的关键统计指标
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {STAT_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className="flex flex-col items-center rounded-2xl bg-white p-5 text-center shadow-sm shadow-agri-primary/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
              >
                <dt className="order-2 mt-3 text-sm font-medium text-agri-muted">{card.label}</dt>
                <dd className="order-1 flex flex-col items-center">
                  <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.bgClass}`}>
                    <Icon className={`h-5 w-5 ${card.iconClass}`} aria-hidden="true" />
                  </span>
                  <span className="mt-3 text-3xl font-bold tabular-nums text-agri-text">
                    {stats[card.value]}
                  </span>
                </dd>
              </div>
            );
          })}
        </dl>
      </div>
    </section>
  );
}
