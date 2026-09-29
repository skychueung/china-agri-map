import { AlertCircle, BadgeCheck, Database, Image, Map as MapIcon, Network } from 'lucide-react';

/**
 * AboutSection —— 关于数据与免责声明（#about）
 * 契约：contract-v2.md「工A」，无 props
 */

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-agri-accent focus-visible:ring-offset-2';

export default function AboutSection() {
  return (
    <section id="about" className="scroll-mt-20 bg-white py-16 sm:py-20" aria-labelledby="about-title">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <h2 id="about-title" className="text-2xl font-bold text-agri-text sm:text-3xl">
            关于数据与免责声明
          </h2>
          <p className="mt-2 text-sm text-agri-muted sm:text-base">
            数据来源、收录范围与使用边界说明
          </p>
        </div>

        <div className="space-y-6">
          {/* 收录范围 */}
          <article className="rounded-2xl border border-agri-primary/10 bg-agri-bg/60 p-6 shadow-sm transition-all duration-300 hover:shadow-md">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-agri-primary">
              <Database className="h-5 w-5" aria-hidden="true" />
              收录范围
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-agri-text sm:text-base">
              本平台收录 53 所农业院校（含林业、水产类院校与具有涉农办学特色的综合性大学）、中国农业科学院等 4 个国家级科研总院、14 个国家级专业研究所，
              以及 30 个省级农科机构（含省级综合农科院与省级专业研究所），共计 101 家机构。
            </p>
            <p className="mt-2 text-sm leading-relaxed text-agri-text sm:text-base">
              特别说明：陕西省无独立建制的省级农业科学院，原陕西省农业科学院于 1999 年并入西北农林科技大学，
              特此说明，以免检索时产生误解。
            </p>
          </article>

          {/* 隶属关系说明 */}
          <article className="rounded-2xl border border-agri-primary/10 bg-agri-bg/60 p-6 shadow-sm transition-all duration-300 hover:shadow-md">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-agri-primary">
              <Network className="h-5 w-5" aria-hidden="true" />
              隶属关系说明
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-agri-text sm:text-base">
              平台以「总院 — 研究所」树形结构组织科研机构：中国农业科学院、中国热带农业科学院、
              中国水产科学研究院、中国林业科学研究院等国家级总院下辖各专业研究所；
              省级机构按省份归类展示。机构的共建、双重隶属等情况在数据中以隶属类型字段标注，
              树形视图仅呈现主要隶属关系。
            </p>
          </article>

          {/* 官网核实说明 */}
          <article className="rounded-2xl border border-agri-primary/10 bg-agri-bg/60 p-6 shadow-sm transition-all duration-300 hover:shadow-md">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-agri-primary">
              <BadgeCheck className="h-5 w-5" aria-hidden="true" />
              官网核实说明
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-agri-text sm:text-base">
              各机构官方网站链接均经人工逐一访问核实并标记状态：「已核实」表示链接可正常访问且指向机构官网；
              「待核实」表示链接尚未完成复核；「暂不可用」表示暂未找到有效官网或链接失效。
              官网信息可能随机构调整而变化，访问时以目标网站实际内容为准。
            </p>
          </article>

          {/* 地图来源声明 */}
          <article className="rounded-2xl border border-agri-primary/10 bg-agri-bg/60 p-6 shadow-sm transition-all duration-300 hover:shadow-md">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-agri-primary">
              <MapIcon className="h-5 w-5" aria-hidden="true" />
              地图来源声明
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-agri-text sm:text-base">
              本站中国地图底图数据来源于 DataV.GeoAtlas（阿里云 DataV 地理小工具）。
              地图完整包含南海诸岛等中国领土，平台未对行政边界做任何修改，
              上线前将再次复核底图完整性与合规性。地图仅用于机构地域分布示意，
              不作为行政区划或边界认定的依据。
            </p>
          </article>

          {/* 占位图版权说明 */}
          <article className="rounded-2xl border border-agri-primary/10 bg-agri-bg/60 p-6 shadow-sm transition-all duration-300 hover:shadow-md">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-agri-primary">
              <Image className="h-5 w-5" aria-hidden="true" />
              占位图版权说明
            </h3>
            <p className="mt-3 break-all text-sm leading-relaxed text-agri-text sm:text-base">
              当前版本中机构标志与校园/机构图片统一使用平台自制占位图
              （/placeholders/logo.svg、/placeholders/campus.svg），不代表各机构真实标识。
              各机构的正式校徽、院徽及相关视觉资产版权归相应机构所有，
              后续如需展示真实标识，将遵循各机构的使用规范并获得授权。
            </p>
          </article>

          {/* 免责声明 */}
          <article className="rounded-2xl border border-agri-accent/30 bg-agri-accent/5 p-6 shadow-sm transition-all duration-300 hover:shadow-md">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-agri-text">
              <AlertCircle className="h-5 w-5 text-agri-accent" aria-hidden="true" />
              免责声明
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-agri-text sm:text-base">
              本平台仅为农业科教资源的公益性信息导航，<strong>不构成任何机构排名</strong>，
              展示顺序不代表实力或声誉评价；平台<strong>不提供招生咨询与报考指导</strong>，
              招生政策、专业设置请以各院校官方发布为准；平台<strong>不提供招聘信息与就业服务</strong>，
              相关需求请直接联系目标机构。
            </p>
            <p className="mt-2 text-sm leading-relaxed text-agri-text sm:text-base">
              如发现数据错漏或链接失效，欢迎通过
              <a
                href="#about"
                className={`mx-1 rounded text-agri-primary underline underline-offset-2 transition-colors duration-300 hover:text-agri-secondary ${FOCUS_RING}`}
              >
                页面反馈渠道
              </a>
              告知，我们将及时核实修正。
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
