import { Sprout } from 'lucide-react';

/**
 * Footer —— 深色页脚
 * 契约：contract-v2.md「工A」，站名「中国农业科教地图」，无 props
 */

interface FooterLink {
  label: string;
  href: string;
}

const NAV_LINKS: FooterLink[] = [
  { label: '首页', href: '#home' },
  { label: '全国地图', href: '#map' },
  { label: '农业院校', href: '#universities' },
  { label: '科研院所', href: '#institutes' },
];

const RESOURCE_LINKS: FooterLink[] = [
  { label: '国家级科研体系', href: '#hierarchy' },
  { label: '省级农科院', href: '#hierarchy' },
  { label: '关于数据', href: '#about' },
];

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-agri-accent focus-visible:ring-offset-2 focus-visible:ring-offset-agri-primary';

export default function Footer() {
  return (
    <footer className="bg-agri-primary text-white" aria-labelledby="footer-title">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-3">
          {/* 站名与简介 */}
          <div>
            <p id="footer-title" className="flex items-center gap-2 text-lg font-bold">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                <Sprout className="h-5 w-5 text-agri-accent" aria-hidden="true" />
              </span>
              中国农业科教地图
            </p>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/70">
              汇集全国农业教育与科研机构，查看地域分布、研究方向和官方网站，
              帮助用户快速了解中国农业科教资源布局。
            </p>
          </div>

          {/* 锚点导航列 */}
          <nav aria-label="页脚导航" className="grid grid-cols-2 gap-8 md:col-span-1">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-agri-accent">
                快速导航
              </h3>
              <ul className="mt-4 space-y-2">
                {NAV_LINKS.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className={`rounded text-sm text-white/75 transition-colors duration-300 hover:text-white ${FOCUS_RING}`}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-agri-accent">
                数据与体系
              </h3>
              <ul className="mt-4 space-y-2">
                {RESOURCE_LINKS.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className={`rounded text-sm text-white/75 transition-colors duration-300 hover:text-white ${FOCUS_RING}`}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </nav>

          {/* 声明 */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-agri-accent">
              声明
            </h3>
            <ul className="mt-4 space-y-2 text-sm leading-relaxed text-white/70">
              <li>本平台仅为公益性信息导航，不构成机构排名。</li>
              <li>不提供招生咨询、报考指导或招聘服务。</li>
              <li>
                地图底图来源于 DataV.GeoAtlas，含南海诸岛，边界未作修改。
              </li>
              <li>
                机构信息以各官方网站发布为准，详见
                <a
                  href="#about"
                  className={`ml-1 rounded text-agri-accent underline underline-offset-2 transition-colors duration-300 hover:text-white ${FOCUS_RING}`}
                >
                  关于数据
                </a>
                。
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-white/15 pt-6 text-center text-sm text-white/60">
          © 2026 中国农业科教地图 · 仅供学习与研究参考
        </div>
      </div>
    </footer>
  );
}
