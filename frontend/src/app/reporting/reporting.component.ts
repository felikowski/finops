import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { ReportingService } from './reporting.service';
import { CostByCategoryAndProvider, CostByDay, CostByMonth } from './reporting.model';

type LoadState = 'loading' | 'loaded' | 'error';
type ViewMode = 'monthly' | 'daily';

interface MonthBar extends CostByMonth {
  /** Bar height as a percentage of the tallest month, for the CSS bar chart. */
  heightPct: number;
  /** % change vs. the previous month in this series; null for the first month (nothing to compare against). */
  changePct: number | null;
}

interface DayBar extends CostByDay {
  /** Bar height as a percentage of the tallest day in the selected month. */
  heightPct: number;
}

interface CategoryGroup {
  category: string;
  totalCost: number;
  providers: { provider: string; totalCost: number }[];
}

@Component({
  selector: 'app-reporting',
  imports: [DecimalPipe],
  templateUrl: './reporting.component.html',
  styleUrl: './reporting.component.css',
})
export class ReportingComponent implements OnInit {
  private reportingService = inject(ReportingService);

  costByMonth = signal<CostByMonth[]>([]);
  loadState = signal<LoadState>('loading');

  costByCategoryAndProvider = signal<CostByCategoryAndProvider[]>([]);
  categoryLoadState = signal<LoadState>('loading');

  viewMode = signal<ViewMode>('monthly');
  selectedMonth = signal<string | null>(null);
  costByDay = signal<CostByDay[]>([]);
  dayLoadState = signal<LoadState>('loaded');

  availableMonths = computed<string[]>(() => this.costByMonth().map((m) => m.period));

  monthBars = computed<MonthBar[]>(() => {
    const months = this.costByMonth();
    const max = Math.max(...months.map((m) => m.totalCost), 0);
    return months.map((m, i) => {
      const previous = months[i - 1];
      const changePct =
        previous && previous.totalCost !== 0
          ? ((m.totalCost - previous.totalCost) / previous.totalCost) * 100
          : null;
      return { ...m, heightPct: max > 0 ? (m.totalCost / max) * 100 : 0, changePct };
    });
  });

  dayBars = computed<DayBar[]>(() => {
    const days = this.costByDay();
    const max = Math.max(...days.map((d) => d.totalCost), 0);
    return days.map((d) => ({ ...d, heightPct: max > 0 ? (d.totalCost / max) * 100 : 0 }));
  });

  /** Rolls the flat (category, provider, cost) rows up into one row per category — so "Compute" isn't repeated once per provider — sorted by category total, then by provider cost within it. */
  categoryGroups = computed<CategoryGroup[]>(() => {
    const groups = new Map<string, CategoryGroup>();
    for (const row of this.costByCategoryAndProvider()) {
      const key = row.serviceCategory ?? '—';
      let group = groups.get(key);
      if (!group) {
        group = { category: key, totalCost: 0, providers: [] };
        groups.set(key, group);
      }
      group.totalCost += row.totalCost;
      group.providers.push({ provider: row.provider, totalCost: row.totalCost });
    }
    return [...groups.values()].sort((a, b) => b.totalCost - a.totalCost);
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loadState.set('loading');
    firstValueFrom(this.reportingService.getCostByMonth())
      .then((byMonth) => {
        this.costByMonth.set(byMonth);
        this.loadState.set('loaded');
        // Preserve the current mode across a manual Refresh — re-apply the
        // active month scope instead of always resetting to the all-time total.
        if (this.viewMode() === 'daily') {
          const month = this.resolveMonthOrLatest();
          if (month) {
            this.selectMonth(month);
            return;
          }
        }
        this.loadCategoryAndProvider(undefined);
      })
      .catch(() => this.loadState.set('error'));
  }

  setViewMode(mode: ViewMode): void {
    this.viewMode.set(mode);
    if (mode === 'monthly') {
      this.loadCategoryAndProvider(undefined);
      return;
    }
    const month = this.resolveMonthOrLatest();
    if (month) {
      this.selectMonth(month);
    }
  }

  onMonthChange(month: string): void {
    this.selectMonth(month);
  }

  private resolveMonthOrLatest(): string | null {
    if (this.selectedMonth()) {
      return this.selectedMonth();
    }
    const months = this.availableMonths();
    return months[months.length - 1] ?? null;
  }

  /** Switches both the daily chart and the category/provider table to the given month, so the two panels always agree on what's being shown. */
  private selectMonth(month: string): void {
    this.selectedMonth.set(month);
    this.loadDay(month);
    this.loadCategoryAndProvider(month);
  }

  private loadDay(month: string): void {
    this.dayLoadState.set('loading');
    firstValueFrom(this.reportingService.getCostByDay(month))
      .then((data) => {
        this.costByDay.set(data);
        this.dayLoadState.set('loaded');
      })
      .catch(() => this.dayLoadState.set('error'));
  }

  private loadCategoryAndProvider(month: string | undefined): void {
    this.categoryLoadState.set('loading');
    firstValueFrom(this.reportingService.getCostByCategoryAndProvider(month))
      .then((data) => {
        this.costByCategoryAndProvider.set(data);
        this.categoryLoadState.set('loaded');
      })
      .catch(() => this.categoryLoadState.set('error'));
  }
}
