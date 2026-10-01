import type { FinancialStatementResult } from '../../src/background/financialStatement/result';
import type { ReportStatus } from '../../src/store/slices/financialStatement';

type Segment = FinancialStatementResult['balanceSheet']['bars'][number]['segments'][number];
const million = 1_000_000;
const available = (value: number) => ({ status: 'AVAILABLE' as const, value });
const missing = { status: 'MISSING_DATA' as const, value: null };
const notCalculable = { status: 'NOT_CALCULABLE' as const, value: null };

function segment(
  key: string,
  label: string,
  amount: number,
  colorRole: string,
  ratio: number | null,
  signedAmount = amount,
): Segment {
  return {
    key,
    label,
    amount: amount * million,
    signedAmount: signedAmount * million,
    colorRole,
    ratio,
    tooltipLabel: null,
  };
}

function trend(
  endYear: number,
  amounts: (readonly [number | null, number | null, number | null])[],
): FinancialStatementResult['freeCashFlowTrend'] {
  return {
    renderable: true,
    note: null,
    points: amounts.map(([operatingCf, investingCf, amount], index) => {
      const year = endYear - 4 + index;
      return {
        year,
        fiscalYearStartDate: `${year - 1}-06-01`,
        fiscalYearEndDate: `${year}-05-31`,
        operatingCf: operatingCf === null ? null : operatingCf * million,
        investingCf: investingCf === null ? null : investingCf * million,
        amount: amount === null ? null : amount * million,
      };
    }),
  };
}

// 金額はAPIと同じ円。公開企業の値と混同しないよう、架空の企業名・証券コードなしで作る。
export const healthyReport: FinancialStatementResult = {
  id: 'preview-healthy-2026',
  stockCode: null,
  companyName: '表示確認用・黒字株式会社',
  fiscalYearStartDate: '2025-06-01',
  fiscalYearEndDate: '2026-05-31',
  consolidationType: 'consolidated',
  accountingStandard: 'japan_gaap',
  balanceSheet: {
    renderable: true,
    note: null,
    bars: [
      {
        label: '借方',
        segments: [
          segment('currentAssets', '流動資産', 600, 'asset1', 60),
          segment('fixedAssets', '固定資産', 400, 'asset2', 40),
        ],
      },
      {
        label: '貸方',
        segments: [
          segment('liabilities', '負債', 700, 'liability1', 70),
          segment('equity', '純資産', 300, 'equity', 30),
        ],
      },
    ],
  },
  profitLoss: {
    renderable: true,
    note: null,
    bars: [
      {
        label: '借方',
        segments: [
          segment('costOfSales', '売上原価', 300, 'expense1', 60),
          segment('sga', '販売一般管理費', 100, 'expense2', 20),
          segment('operatingProfit', '営業利益', 100, 'profit', 20),
        ],
      },
      { label: '貸方', segments: [segment('revenue', '売上', 500, 'revenue', 100)] },
    ],
  },
  cashFlow: {
    renderable: true,
    note: null,
    steps: [
      {
        key: 'cashBegin',
        label: '期首残高',
        amount: 100 * million,
        kind: 'balance',
        colorRole: 'cashIncrease',
      },
      {
        key: 'operating',
        label: '営業CF',
        amount: 150 * million,
        kind: 'flow',
        colorRole: 'cashIncrease',
      },
      {
        key: 'investing',
        label: '投資CF',
        amount: -50 * million,
        kind: 'flow',
        colorRole: 'cashDecrease',
      },
      {
        key: 'financing',
        label: '財務CF',
        amount: -40 * million,
        kind: 'flow',
        colorRole: 'cashDecrease',
      },
      {
        key: 'cashEnd',
        label: '期末残高',
        amount: 160 * million,
        kind: 'balance',
        colorRole: 'cashIncrease',
      },
    ],
  },
  freeCashFlowTrend: trend(2026, [
    [100, -40, 60],
    [50, -50, 0],
    [60, -80, -20],
    [160, -40, 120],
    [150, -50, 100],
  ]),
  financialIndicators: {
    roe: { ...available(1 / 6), source: 'CALCULATED' },
    roa: available(0.05),
    netProfitMargin: available(0.1),
    assetTurnover: available(0.5),
    financialLeverage: available(10 / 3),
  },
};

export const priorYearReport: FinancialStatementResult = {
  ...healthyReport,
  id: 'preview-healthy-2025',
  fiscalYearStartDate: '2024-06-01',
  fiscalYearEndDate: '2025-05-31',
  consolidationType: 'non_consolidated',
  balanceSheet: {
    renderable: true,
    note: null,
    bars: [
      {
        label: '借方',
        segments: [
          segment('currentAssets', '流動資産', 550, 'asset1', 55),
          segment('fixedAssets', '固定資産', 450, 'asset2', 45),
        ],
      },
      healthyReport.balanceSheet.bars[1],
    ],
  },
  profitLoss: {
    renderable: true,
    note: null,
    bars: [
      {
        label: '借方',
        segments: [
          segment('costOfSales', '売上原価', 250, 'expense1', 55.5),
          segment('sga', '販売一般管理費', 120, 'expense2', 26.6),
          segment('operatingProfit', '営業利益', 80, 'profit', 17.7),
        ],
      },
      { label: '貸方', segments: [segment('revenue', '売上', 450, 'revenue', 100)] },
    ],
  },
  cashFlow: {
    renderable: true,
    note: null,
    steps: [
      {
        key: 'cashBegin',
        label: '期首残高',
        amount: 80 * million,
        kind: 'balance',
        colorRole: 'cashIncrease',
      },
      {
        key: 'operating',
        label: '営業CF',
        amount: 130 * million,
        kind: 'flow',
        colorRole: 'cashIncrease',
      },
      {
        key: 'investing',
        label: '投資CF',
        amount: -60 * million,
        kind: 'flow',
        colorRole: 'cashDecrease',
      },
      {
        key: 'financing',
        label: '財務CF',
        amount: -50 * million,
        kind: 'flow',
        colorRole: 'cashDecrease',
      },
      {
        key: 'cashEnd',
        label: '期末残高',
        amount: 100 * million,
        kind: 'balance',
        colorRole: 'cashIncrease',
      },
    ],
  },
  freeCashFlowTrend: trend(2025, [
    [70, -30, 40],
    [100, -40, 60],
    [50, -50, 0],
    [60, -80, -20],
    [130, -60, 70],
  ]),
  financialIndicators: {
    roe: { ...available(2 / 15), source: 'CALCULATED' },
    roa: available(0.04),
    netProfitMargin: available(40 / 450),
    assetTurnover: available(0.45),
    financialLeverage: available(10 / 3),
  },
};

export const lossReport: FinancialStatementResult = {
  ...healthyReport,
  id: 'preview-loss',
  companyName: '表示確認用・赤字と債務超過株式会社',
  balanceSheet: {
    renderable: true,
    note: null,
    bars: [
      {
        label: '借方',
        segments: [
          segment('currentAssets', '流動資産', 60, 'asset1', 60),
          segment('fixedAssets', '固定資産', 40, 'asset2', 40),
        ],
      },
      { label: '貸方', segments: [segment('liabilities', '負債', 120, 'liability1', 120)] },
      {
        label: '債務超過',
        segments: [
          segment('spacer', '', 100, 'spacer', null),
          segment('equity', '純資産', 20, 'equity', -20, -20),
        ],
      },
    ],
  },
  profitLoss: {
    renderable: true,
    note: null,
    bars: [
      {
        label: '借方',
        segments: [
          segment('costOfSales', '売上原価', 70, 'expense1', 87.5),
          segment('sga', '販売一般管理費', 30, 'expense2', 37.5),
        ],
      },
      {
        label: '貸方',
        segments: [
          segment('revenue', '売上', 80, 'revenue', 100),
          segment('operatingLoss', '営業損失', 20, 'loss', -25, -20),
        ],
      },
    ],
  },
  cashFlow: {
    renderable: true,
    note: null,
    steps: [
      {
        key: 'cashBegin',
        label: '期首残高',
        amount: 60 * million,
        kind: 'balance',
        colorRole: 'cashIncrease',
      },
      {
        key: 'operating',
        label: '営業CF',
        amount: -20 * million,
        kind: 'flow',
        colorRole: 'cashDecrease',
      },
      {
        key: 'investing',
        label: '投資CF',
        amount: -50 * million,
        kind: 'flow',
        colorRole: 'cashDecrease',
      },
      {
        key: 'financing',
        label: '財務CF',
        amount: 30 * million,
        kind: 'flow',
        colorRole: 'cashIncrease',
      },
      {
        key: 'cashEnd',
        label: '期末残高',
        amount: 20 * million,
        kind: 'balance',
        colorRole: 'cashIncrease',
      },
    ],
  },
  freeCashFlowTrend: trend(2026, [
    [60, -40, 20],
    [50, -50, 0],
    [20, -30, -10],
    [10, -50, -40],
    [-20, -50, -70],
  ]),
  financialIndicators: {
    roe: { ...notCalculable, source: null },
    roa: available(-0.2),
    netProfitMargin: available(-0.25),
    assetTurnover: available(0.8),
    financialLeverage: notCalculable,
  },
};

export const ifrsReport: FinancialStatementResult = {
  ...healthyReport,
  id: 'preview-ifrs',
  companyName: '表示確認用・IFRSと企業公表ROE株式会社',
  accountingStandard: 'ifrs',
  balanceSheet: {
    ...healthyReport.balanceSheet,
    bars: [
      {
        label: '借方',
        segments: [
          segment('currentAssets', '流動資産', 600, 'asset1', 60),
          segment('nonCurrentAssets', '非流動資産', 400, 'asset2', 40),
        ],
      },
      {
        label: '貸方',
        segments: [
          segment('liabilities', '負債', 700, 'liability1', 70),
          segment('equity', '資本', 300, 'equity', 30),
        ],
      },
    ],
  },
  profitLoss: {
    renderable: true,
    note: null,
    bars: [
      {
        label: '借方',
        segments: [
          segment('costOfSales', '売上原価', 300, 'expense1', 60),
          segment('sga', '販売費及び一般管理費', 110, 'expense2', 22),
          segment('otherNet', 'その他損益（純額）', 40, 'expense3', -8, -40),
          segment('profitBeforeTax', '税引前利益', 50, 'profit', 10),
        ],
      },
      { label: '貸方', segments: [segment('revenue', '収益', 500, 'revenue', 100)] },
    ],
  },
  financialIndicators: {
    ...healthyReport.financialIndicators,
    roe: { ...available(0.372), source: 'DISCLOSED' },
  },
};

export const zeroReport: FinancialStatementResult = {
  ...healthyReport,
  id: 'preview-zero',
  companyName: '表示確認用・ゼロと百万円未満株式会社',
  balanceSheet: {
    renderable: true,
    note: null,
    bars: [
      { label: '借方', segments: [segment('currentAssets', '流動資産', 100, 'asset1', 100)] },
      {
        label: '貸方',
        segments: [
          segment('liabilities', '負債', 100, 'liability1', 100),
          segment('equity', '純資産', 0, 'equity', 0),
        ],
      },
    ],
  },
  // 売上ゼロはバックエンドの契約どおり、架空の0%バーを作らず表示不可で返す。
  profitLoss: { renderable: false, note: '損益計算書: 売上がゼロのため表示できません。', bars: [] },
  cashFlow: {
    renderable: true,
    note: null,
    steps: [
      {
        key: 'cashBegin',
        label: '期首残高',
        amount: 0,
        kind: 'balance',
        colorRole: 'cashIncrease',
      },
      {
        key: 'operating',
        label: '営業CF',
        amount: 250_000,
        kind: 'flow',
        colorRole: 'cashIncrease',
      },
      {
        key: 'investing',
        label: '投資CF',
        amount: -250_000,
        kind: 'flow',
        colorRole: 'cashDecrease',
      },
      { key: 'financing', label: '財務CF', amount: 0, kind: 'flow', colorRole: 'cashIncrease' },
      { key: 'cashEnd', label: '期末残高', amount: 0, kind: 'balance', colorRole: 'cashIncrease' },
    ],
  },
  freeCashFlowTrend: trend(2026, [
    [null, null, null],
    [100, -100, 0],
    [0, 0, 0],
    [null, null, null],
    [0.25, -0.25, 0],
  ]),
  financialIndicators: {
    roe: { ...notCalculable, source: null },
    roa: available(0),
    netProfitMargin: notCalculable,
    assetTurnover: available(0),
    financialLeverage: notCalculable,
  },
};

export const unavailableReport: FinancialStatementResult = {
  ...healthyReport,
  id: 'preview-unavailable',
  companyName: '表示確認用・非常に長い企業名と欠損や未対応形式の表示を確認するための株式会社',
  accountingStandard: 'us_gaap',
  balanceSheet: {
    renderable: false,
    note: '貸借対照表: 米国基準の表示には対応していません。',
    bars: [],
  },
  profitLoss: { renderable: false, note: '損益計算書: 必要な科目がありません。', bars: [] },
  cashFlow: {
    renderable: false,
    note: 'キャッシュフロー計算書: 期首・期末残高がありません。',
    steps: [],
  },
  freeCashFlowTrend: {
    renderable: false,
    note: 'フリーCF: 対象期間のデータがありません。',
    points: [],
  },
  financialIndicators: {
    roe: { ...missing, source: null },
    roa: missing,
    netProfitMargin: missing,
    assetTurnover: missing,
    financialLeverage: missing,
  },
};

const { financialIndicators: omitted, ...legacy } = healthyReport;
// 更新前に保存されたキャッシュだけは、現在のスキーマに必須の指標を持たない。
void omitted;
export const legacyReport = {
  ...legacy,
  id: 'preview-legacy',
  companyName: '表示確認用・旧キャッシュ株式会社',
} as FinancialStatementResult;

export const allReports = [
  healthyReport,
  priorYearReport,
  lossReport,
  ifrsReport,
  zeroReport,
  unavailableReport,
  legacyReport,
];

export interface PreviewScenario {
  id: string;
  name: string;
  description: string;
  reports: FinancialStatementResult[];
  status: ReportStatus;
}

export const scenarios: PreviewScenario[] = [
  {
    id: 'normal',
    name: '黒字・年度違い（2件）',
    description: '貸借一致、純資産30%、売上と費用・利益、正負ゼロを含む5年のフリーCF。',
    reports: [healthyReport, priorYearReport],
    status: 'success',
  },
  {
    id: 'loss',
    name: '赤字・債務超過',
    description: '負の純資産と営業損失、CFの累積が負になる場合、指標の算出不可。',
    reports: [lossReport],
    status: 'success',
  },
  {
    id: 'ifrs',
    name: 'IFRS・企業公表ROE',
    description: '非流動資産・資本・収益、その他損益の色、企業公表値の注記。',
    reports: [ifrsReport],
    status: 'success',
  },
  {
    id: 'zero',
    name: 'ゼロ・百万円未満・欠損年',
    description: '0とデータなしの区別、250千円のCF、純資産ゼロの指標。',
    reports: [zeroReport],
    status: 'success',
  },
  {
    id: 'unavailable',
    name: '長い企業名・未対応・データ欠損',
    description: '長い社名、米国基準、各チャートの表示不可理由、指標の欠損。',
    reports: [unavailableReport],
    status: 'success',
  },
  {
    id: 'legacy',
    name: '旧キャッシュ・指標なし',
    description: '過去に保存された、financialIndicatorsを持たないデータ。',
    reports: [legacyReport],
    status: 'success',
  },
  {
    id: 'all',
    name: '全固定データ（7件）',
    description: '複数企業・複数年度と、上記の境界条件をまとめて表示。',
    reports: allReports,
    status: 'success',
  },
  {
    id: 'empty',
    name: '取得結果0件',
    description: '決算未登録の企業。',
    reports: [],
    status: 'empty',
  },
  {
    id: 'loading',
    name: '読み込み中',
    description: 'APIの応答待ち。',
    reports: [],
    status: 'loading',
  },
  { id: 'error', name: '取得失敗', description: 'APIエラーの案内。', reports: [], status: 'error' },
];
