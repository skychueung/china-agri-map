import { useEffect, useRef, useState } from 'react';
import { Menu, Search, Sprout, X } from 'lucide-react';

/**
 * Header —— 固定顶部毛玻璃导航
 * 契约：contract-v2.md「工A」
 * Header({ onSearch }: { onSearch: (q: string) => void })
 */

interface NavLink {
  label: string;
  href: string;
}

const NAV_LINKS: NavLink[] = [
  { label: '首页', href: '#home' },
  { label: '全国地图', href: '#map' },
  { label: '农业院校', href: '#universities' },
  { label: '科研院所', href: '#institutes' },
  { label: '国家级科研体系', href: '#hierarchy' },
  { label: '省级农科院', href: '#hierarchy' },
  { label: '关于数据', href: '#about' },
];

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-agri-accent focus-visible:ring-offset-2';

function scrollToFilter() {
  document.getElementById('filter')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function Header({ onSearch }: { onSearch: (q: string) => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current !== null) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const triggerSearch = (value: string) => {
    onSearch(value);
    scrollToFilter();
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current !== null) {
      window.clearTimeout(debounceRef.current);
    }
    // 防抖 300ms，输入即调 onSearch 并滚动到 #filter
    debounceRef.current = window.setTimeout(() => triggerSearch(value), 300);
  };

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (debounceRef.current !== null) {
      window.clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    triggerSearch(query);
  };

  const searchInput = (
    <form role="search" onSubmit={handleSearchSubmit} className="relative w-full">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-agri-muted"
        aria-hidden="true"
      />
      <input
        id="global-search-input"
        type="search"
        aria-label="全局搜索"
        placeholder="搜索院校、院所、省份、领域…"
        value={query}
        onChange={(event) => handleQueryChange(event.target.value)}
        className={`w-full rounded-full border border-agri-primary/20 bg-white/80 py-2 pl-9 pr-4 text-sm text-agri-text placeholder:text-agri-muted/70 shadow-sm transition-all duration-300 focus:border-agri-primary ${FOCUS_RING}`}
      />
    </form>
  );

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/90 shadow-lg shadow-agri-primary/10 backdrop-blur-md'
          : 'bg-white/60 backdrop-blur-sm'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        {/* 站名与标识 */}
        <a
          href="#home"
          className={`flex shrink-0 items-center gap-2 rounded-lg ${FOCUS_RING}`}
          aria-label="中国农业科教地图 · 返回首页"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-agri-primary text-white">
            <Sprout className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="whitespace-nowrap text-base font-bold text-agri-primary sm:text-lg">
            中国农业科教地图
          </span>
        </a>

        {/* 桌面端锚点导航 */}
        <nav aria-label="主导航" className="hidden flex-1 items-center justify-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-agri-text transition-all duration-300 hover:bg-agri-bg hover:text-agri-primary ${FOCUS_RING}`}
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* 桌面端全局搜索 */}
        <div className="hidden w-56 shrink-0 md:block lg:w-64">{searchInput}</div>

        {/* 移动端汉堡按钮 */}
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          aria-label={menuOpen ? '关闭导航菜单' : '打开导航菜单'}
          className={`ml-auto flex h-10 w-10 items-center justify-center rounded-xl text-agri-primary transition-all duration-300 hover:bg-agri-bg md:ml-0 lg:hidden ${FOCUS_RING}`}
        >
          {menuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
        </button>
      </div>

      {/* 移动端折叠菜单 */}
      {menuOpen && (
        <div id="mobile-nav" className="border-t border-agri-primary/10 bg-white/95 backdrop-blur-md lg:hidden">
          <div className="mx-auto max-w-7xl space-y-3 px-4 py-4 sm:px-6">
            <div className="md:hidden">{searchInput}</div>
            <nav aria-label="移动端导航" className="grid grid-cols-2 gap-2">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={`rounded-xl bg-agri-bg px-4 py-3 text-sm font-medium text-agri-text transition-all duration-300 hover:bg-agri-primary hover:text-white ${FOCUS_RING}`}
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
