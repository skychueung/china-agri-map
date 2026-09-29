# 中国农业科教地图（V2）

> **在线访问**：https://skychueung.github.io/china-agri-map/ （GitHub Pages，`gh-pages` 分支自动发布）

中国农业院校与科研院所地图导航平台：一个汇集全国农业院校与农业科研机构（国家级科研体系 + 省级农科院体系）的单页导航网站。通过中国地图直观展示机构地域分布，支持按地区、省份、机构类型、科研体系、研究领域筛选与关键词搜索，并提供各机构官方网站入口与科研体系层级浏览。

当前收录 **101 个机构**：农业院校 53 所（含林业、水产类院校与涉农特色综合性大学）+ 农业科研机构 48 个（国家级总院 4、国家级专业所 14、省级农科院 30）。

## 定位声明

- 本站是**导航工具**：帮助用户找到农业院校与农业科研机构的官方网站，并直观了解其地域分布与隶属体系。
- 本站**不是排名网站**，不对任何机构进行排序、评分或比较。
- 本站**不是招生平台**，不提供招生咨询、报名、录取查询等服务；「是否招收研究生」筛选仅基于机构简介中的公开表述，正式信息以各单位研究生院/官网为准。
- 本站**不是招聘平台**，不提供任何人事招聘信息。
- 机构信息（简介、官网地址等）仅供导航参考，正式使用前请核实。

## 快速开始

```bash
npm install        # 安装依赖
npm run dev        # 启动开发服务器（默认 http://localhost:3000，可用 -- --port 7100 指定端口）
npm run build      # 生产构建（tsc 类型检查 + vite 构建，输出 dist/）
npm run preview    # 本地预览生产构建产物
```

技术栈：React 19 + Vite 7 + TypeScript + Tailwind CSS 3 + ECharts 6（地图与散点）+ lucide-react（图标）+ Playwright（验收测试）。

主题色（`tailwind.config.js` 语义类）：`agri-primary #1F6B45`（深绿）、`agri-secondary #4F8A5B`、`agri-bg #F1F7F3`、`agri-map #DCEADF`、`agri-accent #D6A84B`（麦穗金）、`agri-text`、`agri-muted`。

## 目录结构

```
app/
├── index.html                        # 页面入口（标题「中国农业科教地图」）
├── public/
│   ├── favicon.svg                   # 站点图标（麦穗）
│   ├── geojson/china.json            # 中国地图 GeoJSON（见下文「地图数据来源」）
│   └── placeholders/                 # 机构标识 / 院区图占位 SVG
├── src/
│   ├── App.tsx                       # 单页根组件（集成与全部联动逻辑）
│   ├── main.tsx / index.css          # 入口与全局样式
│   ├── types/institution.ts          # AgriculturalInstitution / 筛选 / 统计类型定义
│   ├── data/
│   │   ├── universities.ts           # ★ 农业院校数据（53 所：V1 基础 25 + 2026-09-30 补录 28）
│   │   ├── universitiesBatch2026A.ts # ★ 补录批次 A（15 所：林业 5 + 水产 5 + 农业本科 5）
│   │   ├── universitiesBatch2026B.ts # ★ 补录批次 B（13 所涉农特色综合大学）
│   │   ├── researchInstitutes.ts     # ★ 农业科研机构数据（48 个：总院 + 专业所）
│   │   ├── agriculturalInstitutions.ts  # 合并导出（101 个，页面唯一数据源）
│   │   └── researchFields.ts         # ★ 研究领域受控词表（RESEARCH_FIELDS + FIELD_GROUPS）
│   ├── hooks/
│   │   ├── useInstitutionFilters.ts  # 筛选状态 Hook
│   │   └── useMapSelection.ts        # 地图选中 / 悬停 / 体系展开状态
│   ├── utils/
│   │   ├── institutionFilters.ts     # 筛选 / 统计 / 省份 / 体系 / 领域列表 / 二级类型计数
│   │   ├── buildInstitutionTree.ts   # 科研体系树构建 / 节点查找 / 后代 id 收集
│   │   ├── mapPointStyle.ts          # 地图点位分类（形状 + 颜色）
│   │   └── mapCoordinates.ts         # 地图坐标与同城抖动偏移
│   └── components/
│       ├── Header.tsx                # 固定顶部导航（锚点 + 全局搜索 + 移动端菜单）
│       ├── HeroSection.tsx           # #home 首屏
│       ├── InstitutionTypeTabs.tsx   # 机构大类 tab + 科研院所二级多选 chips
│       ├── ChinaInstitutionMap.tsx   # #map ECharts 中国地图 + 分类散点
│       ├── MapLegend.tsx             # 点位形状颜色图例
│       ├── MapTooltipCard.tsx        # 地图浮层 / 移动端底部信息条卡片
│       ├── StatisticsSection.tsx     # 数据总览（10 项统计，基于全量数据）
│       ├── InstitutionFilters.tsx    # #filter 地区 / 省份 / 体系 / 领域 / 级别 / 复选项
│       ├── InstitutionGrid.tsx       # 机构卡片网格（#universities / #institutes）
│       ├── UniversityCard.tsx        # 院校卡片
│       ├── ResearchInstituteCard.tsx # 科研机构卡片
│       ├── EmptyState.tsx            # 空结果态（广播 agri:reset-filters 事件）
│       ├── InstitutionHierarchy.tsx  # #hierarchy 科研体系浏览（国家级 / 省级分组面板）
│       ├── InstitutionTree.tsx       # 体系树递归组件
│       ├── AboutSection.tsx          # #about 收录范围与免责声明
│       └── Footer.tsx
├── scripts/
│   └── generate-verification-table.py  # 生成官网核实状态表（见 WEBSITE_VERIFICATION.md）
└── e2e-v2.mjs                        # V2 验收 Playwright 脚本（17 项检查）
```

## 机构数据维护

数据文件：`src/data/universities.ts`（院校）与 `src/data/researchInstitutes.ts`（科研机构），统一导出 `AgriculturalInstitution[]`，字段定义见 `src/types/institution.ts`：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `string` | 唯一标识，英文短横线命名（如 `hvri-caas`），用于卡片 DOM id（`card-<id>`）、地图点位 id 与体系树关联 |
| `name` | `string` | 机构全称 |
| `shortName` | `string?` | 常用简称（可被全局搜索命中，如「哈兽研」） |
| `institutionKind` | `'university' \| 'research_academy' \| 'research_institute'` | 院校 / 科研总院 / 专业研究所；决定进入哪个卡片网格与地图点位样式 |
| `institutionLevel` | `'national' \| 'provincial' \| 'municipal' \| 'regional'` | 国家级 / 省级 / 地市级 / 区域性 |
| `parentInstitutionId` | `string?` | 上级总院 `id`；设置后该机构自动挂入对应总院的体系树与体系筛选 |
| `parentInstitutionName` | `string?` | 上级总院名称（冗余展示字段，与 id 同步维护） |
| `affiliationType` | `'direct' \| 'joint' \| 'dual' \| 'independent'?'` | 隶属关系类型（直属 / 共建 / 双重隶属 / 独立设置） |
| `province` / `city` | `string` | 所在省份（标准全称，如「黑龙江省」）/ 城市 |
| `region` | `Region` | 七大地区之一（`港澳台地区` 暂未收录） |
| `address` | `string?` | 详细地址 |
| `latitude` / `longitude` | `number \| null` | 经纬度；为 `null` 时该机构不显示在地图上（卡片与筛选不受影响） |
| `locationSource` | `string?` | 坐标来源说明（便于追溯与复核） |
| `website` | `string \| null?` | 官网地址；无可用官网时填 `null` |
| `websiteStatus` | `'verified' \| 'pending' \| 'unavailable'` | 官网核实状态，控制官网按钮行为 |
| `logo` / `image` | `string?` | 机构标识 / 院区图路径（当前均为占位图） |
| `imageSource` | `string?` | 图片来源说明 |
| `description` | `string` | 机构简介（卡片与地图浮层展示，可被搜索命中） |
| `researchFields` | `string[]?` | 研究领域，**必须取自受控词表** `src/data/researchFields.ts` 的 `RESEARCH_FIELDS` |
| `educationLevel` | `string?` | 院校用：办学层次（本科 / 高职） |
| `graduateTraining` | `boolean?` | 是否招收研究生：仅当 `description` 明确提及硕士/博士/本硕博/研究生培养时标 `true`，否则保持 `undefined`（证据驱动，不推测） |
| `featured` | `boolean?` | 是否重点展示（体系树排序优先） |
| `dataSource` / `lastVerifiedAt` | `string?` | 数据来源 / 最近核实日期 |

### 新增一个专业研究所（挂到总院）

1. 在 `src/data/researchInstitutes.ts` 数组中追加一个对象，按上表填写字段。
2. `id` 不得与现有条目重复。
3. **挂到总院**：将 `parentInstitutionId` 设为总院的 `id`（如中国农业科学院为 `caas`），`parentInstitutionName` 同步填总院全称。保存后该研究所自动出现在：
   - 体系筛选下拉（该总院 count +1，与筛选结果严格一致）；
   - `#hierarchy` 科研体系浏览中该总院的面板树；
   - 选中该总院时地图的金色描边高亮集合。
4. 不设 `parentInstitutionId` 的机构视为根节点，卡片「所属体系」显示「独立设置」。
5. 保存后无需改动其他代码：统计、筛选、地图点位、卡片、体系树均由数据驱动自动生成。

### 标记官网待核实 / 不可用

- 核实通过：`website` 填官网地址，`websiteStatus: 'verified'`（只有 verified 的官网按钮允许跳转）。
- **待核实**：`websiteStatus: 'pending'`，卡片与浮层显示「官网待核实」并禁用跳转。
- 暂不可用：`websiteStatus: 'unavailable'`；`website` 可填 `null`。

### 修改经纬度

直接修改 `latitude` / `longitude` 即可，地图点位位置随之更新；请同步更新 `locationSource` 来源说明。注意坐标系问题（见下文「坐标系说明」）。同城多机构点位由 `src/utils/mapCoordinates.ts` 的确定性环形抖动自动错开，无需手工偏移。

### 研究领域受控词表

`researchFields` 只能取自 `src/data/researchFields.ts` 的 `RESEARCH_FIELDS`（任务书 29 个领域）。筛选面板的领域下拉按同文件 `FIELD_GROUPS`（畜牧兽医 / 作物植保 / 资源环境 / 工程信息 / 其他）分组展示。新增领域词必须先扩词表，再在机构数据中使用。

## 中国地图数据来源

- 底图文件：`public/geojson/china.json`，来自阿里云 **DataV.GeoAtlas**：
  `https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json`
- 内容：中华人民共和国全国边界（adcode 100000），含 34 个省级行政区要素及**南海诸岛**线要素。
- 数据**未作任何修改**（包括各省边界与南海诸岛线），仅作为开发阶段的 ECharts 底图使用。
- **正式上线前必须复核合规性**（测绘资质、审图号、边界表达等）；对外发布时应改用具有法定资质的地图服务或经审核的标准地图。详见 `public/geojson/README.md`。

## 坐标系说明

机构坐标为 GCJ-02 / WGS-84 混合的公开资料约值（详见各机构 `locationSource` 字段），直接叠加在 DataV GeoJSON（WGS-84 经纬度）底图上。全国尺度展示无明显影响，但不适用于城市级精确定位；如需精确展示须统一坐标系并逐一复核。

## 图片资源（占位与替换规范）

当前所有机构标识与院区图均为本地自制占位 SVG（`public/placeholders/logo.svg`、`campus.svg`），不代表各机构真实标识；图片加载失败时组件也会自动回退到这两个占位图。

替换为真实图片时，建议按以下规范放置：

- 机构标识：`/images/logos/<id>.png`（正方形、透明底 PNG 或 WebP，宽度 ≥ 200px）。
- 院区图：`/images/campuses/<id>.jpg`（**16:9**，建议 1280×720，WebP 或压缩 JPEG，单张 ≤ 200KB）。
- 文件放入 `public/images/...` 后，将数据文件中对应机构的 `logo` / `image` 字段改为上述路径。
- 各机构正式校徽、院徽及视觉资产版权归相应机构所有，替换前须遵循其使用规范并获得授权。

## 验收与测试

`e2e-v2.mjs` 为 V2 集成验收脚本（Playwright，需 dev server 运行在 `http://127.0.0.1:7100`）：

```bash
npm run dev -- --port 7100 --host 127.0.0.1   # 终端 1
node e2e-v2.mjs                                # 终端 2：17 项检查（视口溢出 / 截图 / 交互抽查 / console 错误）
```

六视口整页截图输出至 `../screenshots/v2-*.png`。脚本通过开发模式下暴露的 `window.__agriMapChart`（仅 `import.meta.env.DEV` 时存在）换算点位屏幕坐标；使用本机 Playwright 浏览器缓存（`chromium-1223`），如需切换版本请改脚本顶部 `CHROMIUM_EXE`。
