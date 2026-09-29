import { GraduationCap, Landmark, Map } from 'lucide-react';

/**
 * HeroSection —— 首屏（#home）
 * 契约：contract-v2.md「工A」，无 props
 * 深绿渐变底 + 装饰 SVG；三按钮：查看全国地图(#map 金色实心)、
 * 浏览农业院校(#universities)、浏览科研院所(#institutes)（白色描边）
 */

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-agri-accent focus-visible:ring-offset-2 focus-visible:ring-offset-agri-primary';

export default function HeroSection() {
  return (
    <section
      id="home"
      className="relative scroll-mt-20 overflow-hidden bg-gradient-to-br from-agri-primary via-[#17573A] to-[#0E3D27] pt-16"
      aria-labelledby="hero-title"
    >
      {/* 装饰 SVG：麦穗纹理与光斑，纯装饰对读屏器隐藏 */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <svg className="absolute inset-0 h-full w-full opacity-10" preserveAspectRatio="none" viewBox="0 0 1200 600">
          <defs>
            <pattern id="hero-grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#ffffff" strokeWidth="0.6" />
            </pattern>
          </defs>
          <rect width="1200" height="600" fill="url(#hero-grid)" />
        </svg>
        <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-agri-accent/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-agri-secondary/30 blur-3xl" />
        {/* 抽象麦穗装饰 */}
        <svg
          className="absolute bottom-0 right-8 hidden h-64 w-64 text-agri-accent/25 md:block"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 22V12M12 12c0-2.5-1.5-4.5-4-5 0 2.8 1.6 4.6 4 5Zm0 0c0-2.5 1.5-4.5 4-5 0 2.8-1.6 4.6-4 5Zm0-5c0-2.2-1.2-4-3-4.5C9 9.7 10.2 11.4 12 12Zm0 0c0-2.2 1.2-4 3-4.5 0 2.2-1.2 3.9-3 4.5Z" />
        </svg>
      </div>

      <div className="relative mx-auto flex max-w-7xl flex-col items-center px-4 py-20 text-center sm:px-6 sm:py-24 lg:px-8 lg:py-28">
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-sm font-medium text-white/90 backdrop-blur-sm">
          <Map className="h-4 w-4" aria-hidden="true" />
          全国农业科教资源导航
        </span>

        <h1 id="hero-title" className="max-w-4xl text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
          中国农业院校与科研院所地图
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/90 sm:text-xl">
          汇集全国农业教育与科研机构，查看地域分布、研究方向和官方网站。
        </p>

        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-white/70 sm:text-base">
          覆盖农业院校、国家级农业科研院、省级农科院及专业研究所，帮助用户快速了解中国农业科教资源布局。
        </p>

        {/* 三个行动按钮 */}
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <a
            href="#map"
            className={`inline-flex items-center gap-2 rounded-full bg-agri-accent px-7 py-3 text-base font-semibold text-agri-text shadow-lg shadow-black/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#C99B3F] ${FOCUS_RING}`}
          >
            <Map className="h-5 w-5" aria-hidden="true" />
            查看全国地图
          </a>
          <a
            href="#universities"
            className={`inline-flex items-center gap-2 rounded-full border-2 border-white/80 bg-transparent px-7 py-3 text-base font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/10 ${FOCUS_RING}`}
          >
            <GraduationCap className="h-5 w-5" aria-hidden="true" />
            浏览农业院校
          </a>
          <a
            href="#institutes"
            className={`inline-flex items-center gap-2 rounded-full border-2 border-white/80 bg-transparent px-7 py-3 text-base font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/10 ${FOCUS_RING}`}
          >
            <Landmark className="h-5 w-5" aria-hidden="true" />
            浏览科研院所
          </a>
        </div>
      </div>
    </section>
  );
}
