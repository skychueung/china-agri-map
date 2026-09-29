// ==========================================================================
// 涉农高校数据模型迁移脚本（一次性，W2 Schema 重构）
// 对 universities.ts / universitiesBatch2026A.ts / universitiesBatch2026B.ts
// 的 53 条记录批量改写并落盘为正常字面量记录：
//   1. educationLevel: '本科' → 'bachelor' + educationType: 'regular'
//   2. 按 locationSource 解析 coordinateSystem（BD09/WGS84/GCJ02，默认 GCJ02）
//   3. 按校名映射 affiliationCategory / universityCategory
//   4. 11 所补 graduateTraining: true
//   5. 14 所涉农综合大学补 inclusionReason
// ==========================================================================
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const dataDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data');
const FILES = ['universities.ts', 'universitiesBatch2026A.ts', 'universitiesBatch2026B.ts'];

// ── 隶属类型映射 ──────────────────────────────────────────────────────────
const MOE = ['中国农业大学', '南京农业大学', '华中农业大学', '西北农林科技大学', '北京林业大学', '东北林业大学', '中国海洋大学', '浙江大学', '西南大学', '兰州大学', '吉林大学'];
const XPCC = ['石河子大学', '塔里木大学'];
const MUNICIPAL = ['北京农学院', '上海海洋大学', '天津农学院'];

function affiliationOf(name) {
  if (MOE.includes(name)) return 'ministry_of_education';
  if (XPCC.includes(name)) return 'xpcc';
  if (MUNICIPAL.includes(name)) return 'municipal';
  return 'provincial';
}

// ── 涉农分类映射 ──────────────────────────────────────────────────────────
const FORESTRY = ['北京林业大学', '东北林业大学', '南京林业大学', '中南林业科技大学', '西南林业大学'];
const AQUATIC = ['中国海洋大学', '上海海洋大学', '大连海洋大学', '浙江海洋大学', '广东海洋大学'];
const AFC = ['吉林大学', '浙江大学', '西南大学', '海南大学', '扬州大学', '广西大学', '贵州大学', '石河子大学', '宁夏大学', '青海大学', '延边大学', '长江大学', '兰州大学', '江苏大学'];
const AGRI_FORESTRY = ['福建农林大学', '浙江农林大学'];

function categoriesOf(name) {
  if (FORESTRY.includes(name)) return ['forestry'];
  if (AQUATIC.includes(name)) return ['aquatic'];
  if (name === '江苏大学') return ['agriculture_featured_comprehensive', 'agricultural_engineering'];
  if (AFC.includes(name)) return ['agriculture_featured_comprehensive'];
  if (AGRI_FORESTRY.includes(name)) return ['agriculture', 'forestry'];
  if (name === '西藏农牧大学') return ['agriculture', 'animal_husbandry'];
  return ['agriculture'];
}

// ── 补标 graduateTraining 的 11 所 ────────────────────────────────────────
const ADD_GRADUATE = ['南京农业大学', '华中农业大学', '华南农业大学', '西北农林科技大学', '东北农业大学', '四川农业大学', '河南农业大学', '安徽农业大学', '沈阳农业大学', '吉林农业大学', '黑龙江八一农垦大学'];

// ── 涉农综合大学收录依据 ──────────────────────────────────────────────────
const INCLUSION_REASON = {
  浙江大学: '设农业与生物技术学院，农学/植保/园艺/动科等农科专业与涉农博士点完整',
  兰州大学: '草地农业科技学院，草业科学为国家重点学科，本硕博体系完整',
  江苏大学: '源自镇江农业机械学院，农业工程（农业机械）为国家重点学科',
  吉林大学: '涉农学科集中和平校区，设动物医学/动物科学/植物科学/食品科学与工程四学院，预防兽医学为国家重点学科',
  西南大学: '由西南师范大学与西南农业大学合并组建，设农学与生物科技学院、园艺园林学院、动物科学技术学院等涉农学院',
  海南大学: '由海南大学与华南热带农业大学合并组建，设热带农林学院，热带作物与热带园艺特色鲜明',
  扬州大学: '合并江苏农学院组建，设农学院、园艺与植物保护学院、动物科学与技术学院、兽医学院等涉农学院',
  广西大学: '与广西农业大学合并组建，设农学院、动物科学技术学院、林学院等涉农学院',
  贵州大学: '合并贵州农学院等院校，设农学院、动物科学学院，植物保护（绿色农药）特色突出',
  石河子大学: '由石河子农学院等合并组建，设农学院、动物科技学院，兵团共建，绿洲农业与棉花特色鲜明',
  宁夏大学: '与宁夏农学院合并组建，设农学院，旱区作物、草畜产业与葡萄园艺区域特色鲜明',
  青海大学: '合并青海畜牧兽医学院、青海省农林科学院，设农牧学院，高原畜牧兽医与草业特色鲜明',
  延边大学: '合并延边农学院组建，设农学院，依托长白山生物资源发展作物、园艺与畜牧学科',
  长江大学: '合并湖北农学院组建，设农学院、动物科学技术学院，作物学、植物保护具一级学科博士点',
};

// ── 坐标系解析 ────────────────────────────────────────────────────────────
function coordinateSystemOf(locationSource) {
  if (/百度|BD-?09/i.test(locationSource)) return 'BD09';
  if (/WGS/i.test(locationSource)) return 'WGS84';
  if (/高德|GCJ/i.test(locationSource)) return 'GCJ02';
  return 'GCJ02';
}

let totalRecords = 0;

for (const file of FILES) {
  const path = join(dataDir, file);
  let text = readFileSync(path, 'utf8');

  // 步骤 1：educationLevel 字面量替换
  text = text.replaceAll(
    "educationLevel: '本科',",
    "educationLevel: 'bachelor',\n    educationType: 'regular',",
  );

  // 步骤 2-5：逐条记录插入新字段（从后往前处理，保持索引有效）
  const nameRe = /name: '([^']+)',/g;
  const inserts = []; // { pos, lines }
  let match;
  while ((match = nameRe.exec(text)) !== null) {
    const name = match[1];
    const recordEnd = text.indexOf('\n  },', match.index);
    if (recordEnd === -1) throw new Error(`记录未闭合: ${name} (${file})`);
    const recordText = text.slice(match.index, recordEnd);

    const locMatch = recordText.match(/locationSource: '([^']*)'/);
    const coordinateSystem = coordinateSystemOf(locMatch ? locMatch[1] : '');

    const eduTypeIdx = text.indexOf("educationType: 'regular',", match.index);
    if (eduTypeIdx === -1 || eduTypeIdx > recordEnd) {
      throw new Error(`未找到 educationType 行: ${name} (${file})`);
    }
    const lineEnd = text.indexOf('\n', eduTypeIdx);

    const lines = [
      `coordinateSystem: '${coordinateSystem}',`,
      `affiliationCategory: '${affiliationOf(name)}',`,
      `universityCategory: [${categoriesOf(name).map((c) => `'${c}'`).join(', ')}],`,
    ];
    if (INCLUSION_REASON[name]) lines.push(`inclusionReason: '${INCLUSION_REASON[name]}',`);
    if (ADD_GRADUATE.includes(name) && !recordText.includes('graduateTraining')) {
      lines.push('graduateTraining: true,');
    }
    inserts.push({ pos: lineEnd, text: '\n    ' + lines.join('\n    ') });
    totalRecords += 1;
  }

  inserts.sort((a, b) => b.pos - a.pos);
  for (const ins of inserts) {
    text = text.slice(0, ins.pos) + ins.text + text.slice(ins.pos);
  }

  writeFileSync(path, text, 'utf8');
  console.log(`${file}: ${inserts.length} 条记录已迁移`);
}

console.log(`合计迁移 ${totalRecords} 条记录`);
