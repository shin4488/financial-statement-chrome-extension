import { allReports, healthyReport, lossReport, scenarios, zeroReport } from './fixtures';
import { colorByRole } from '../../src/shared/financialCharts/colorRoles';

const currentReports = allReports.filter((report) => report.id !== 'preview-legacy');

describe('表示確認データの会計・API契約', () => {
  it('正常BSは負債と純資産で資産合計に釣り合い、純資産を透明な空白にしない', () => {
    const [assets, credit] = healthyReport.balanceSheet.bars;
    expect(assets.segments.reduce((sum, item) => sum + item.signedAmount, 0)).toBe(1_000_000_000);
    expect(credit.segments.reduce((sum, item) => sum + item.signedAmount, 0)).toBe(1_000_000_000);
    expect(credit.segments.find((item) => item.colorRole === 'equity')).toMatchObject({
      signedAmount: 300_000_000,
      ratio: 30,
    });
    expect(credit.segments.some((item) => item.colorRole === 'spacer')).toBe(false);
  });

  it('PLはBSのコピーではなく、売上・費用・利益を持つ', () => {
    expect(healthyReport.profitLoss).not.toEqual(healthyReport.balanceSheet);
    const segments = healthyReport.profitLoss.bars.flatMap((bar) => bar.segments);
    expect(segments.map((item) => item.label)).toEqual([
      '売上原価',
      '販売一般管理費',
      '営業利益',
      '売上',
    ]);
    expect(segments.find((item) => item.key === 'revenue')?.signedAmount).toBe(500_000_000);
  });

  it('損失は描画高を正、実値・比率を負にし、債務超過の空白は資産合計と等しい', () => {
    const [assets, liabilities, deficit] = lossReport.balanceSheet.bars;
    const assetTotal = assets.segments.reduce((sum, item) => sum + item.amount, 0);
    const liabilityTotal = liabilities.segments.reduce((sum, item) => sum + item.signedAmount, 0);
    const equity = deficit.segments.find((item) => item.colorRole === 'equity');
    expect(liabilityTotal + (equity?.signedAmount ?? 0)).toBe(assetTotal);
    expect(equity).toMatchObject({ amount: 20_000_000, signedAmount: -20_000_000, ratio: -20 });
    expect(deficit.segments.find((item) => item.colorRole === 'spacer')).toMatchObject({
      amount: assetTotal,
      ratio: null,
    });
    expect(lossReport.profitLoss.bars[1].segments[1]).toMatchObject({
      amount: 20_000_000,
      signedAmount: -20_000_000,
      ratio: -25,
      colorRole: 'loss',
    });
  });

  it.each(currentReports)('$id: 描画用の値・色・科目キーとPLの左右合計が有効', (report) => {
    for (const chart of [report.balanceSheet, report.profitLoss]) {
      if (!chart.renderable) {
        expect(chart.note).toBeTruthy();
        expect(chart.bars).toEqual([]);
        continue;
      }
      for (const bar of chart.bars) {
        const keys = bar.segments.map((item) => item.key);
        expect(new Set(keys).size).toBe(keys.length);
        for (const item of bar.segments) {
          expect(Number.isFinite(item.amount)).toBe(true);
          expect(item.amount).toBeGreaterThanOrEqual(0);
          expect(item.amount).toBe(Math.abs(item.signedAmount));
          expect(colorByRole).toHaveProperty(item.colorRole);
        }
      }
    }
    if (report.profitLoss.renderable) {
      const totals = report.profitLoss.bars.map((bar) =>
        bar.segments.reduce((sum, item) => sum + item.amount, 0),
      );
      expect(totals[0]).toBe(totals[1]);
    }
  });

  it.each(currentReports)('$id: CFの期首＋増減＝期末、フリーCF＝営業＋投資CF', (report) => {
    if (!report.cashFlow.renderable) {
      expect(report.cashFlow.steps).toEqual([]);
      return;
    }
    const steps = report.cashFlow.steps;
    expect(
      steps[0].amount +
        steps.filter((item) => item.kind === 'flow').reduce((sum, item) => sum + item.amount, 0),
    ).toBe(steps[steps.length - 1].amount);
    for (const point of report.freeCashFlowTrend.points) {
      if (point.operatingCf === null || point.investingCf === null) {
        expect(point.amount).toBeNull();
      } else {
        expect(point.amount).toBe((point.operatingCf ?? 0) + (point.investingCf ?? 0));
      }
    }
    const latest = report.freeCashFlowTrend.points[4];
    expect(latest.fiscalYearEndDate).toBe(report.fiscalYearEndDate);
    expect(latest.operatingCf).toBe(steps.find((item) => item.key === 'operating')?.amount);
    expect(latest.investingCf).toBe(steps.find((item) => item.key === 'investing')?.amount);
  });

  it.each(currentReports)('$id: 算出されたROE・ROAは分解指標の積と一致する', (report) => {
    const metrics = report.financialIndicators;
    for (const metric of Object.values(metrics)) {
      if (metric.status === 'AVAILABLE') {
        expect(Number.isFinite(metric.value)).toBe(true);
      } else {
        expect(metric.value).toBeNull();
      }
    }
    if (
      metrics.netProfitMargin.status === 'AVAILABLE' &&
      metrics.assetTurnover.status === 'AVAILABLE'
    ) {
      const roa = (metrics.netProfitMargin.value ?? 0) * (metrics.assetTurnover.value ?? 0);
      expect(metrics.roa.value).toBeCloseTo(roa);
      if (metrics.roe.source === 'CALCULATED' && metrics.financialLeverage.status === 'AVAILABLE') {
        expect(metrics.roe.value).toBeCloseTo(roa * (metrics.financialLeverage.value ?? 0));
      }
    }
  });

  it('実在する0円と欠損年を混同せず、百万円未満も円で保持する', () => {
    const points = zeroReport.freeCashFlowTrend.points;
    expect(points.filter((point) => point.amount === 0)).toHaveLength(3);
    expect(points.filter((point) => point.amount === null)).toHaveLength(2);
    expect(points[4].operatingCf).toBe(250_000);
    expect(healthyReport.cashFlow.steps[1].amount).toBe(150_000_000);
  });

  it('複数年度・企業・旧キャッシュ・空・読込中・失敗を選べる', () => {
    expect(scenarios.find((item) => item.id === 'normal')?.reports).toHaveLength(2);
    expect(new Set(allReports.map((report) => report.id)).size).toBe(allReports.length);
    expect(new Set(allReports.map((report) => report.companyName)).size).toBeGreaterThan(1);
    expect(scenarios.find((item) => item.id === 'legacy')?.reports[0]).not.toHaveProperty(
      'financialIndicators',
    );
    for (const id of ['empty', 'loading', 'error']) {
      expect(scenarios.find((item) => item.id === id)?.status).toBe(id);
      expect(scenarios.find((item) => item.id === id)?.reports).toEqual([]);
    }
  });
});
