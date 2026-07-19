import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { ReportingService } from './reporting.service';
import { CostByDay, CostByMonth, CostByProviderAndService } from './reporting.model';

type LoadState = 'loading' | 'loaded' | 'error';
type ViewMode = 'monthly' | 'daily';

interface MonthBar extends CostByMonth {
  /** Bar height as a percentage of the tallest month, for the CSS bar chart. */
  heightPct: number;
}

interface DayBar extends CostByDay {
  /** Bar height as a percentage of the tallest day in the selected month. */
  heightPct: number;
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
  costByProviderAndService = signal<CostByProviderAndService[]>([]);
  loadState = signal<LoadState>('loading');

  viewMode = signal<ViewMode>('monthly');
  selectedMonth = signal<string | null>(null);
  costByDay = signal<CostByDay[]>([]);
  dayLoadState = signal<LoadState>('loaded');

  availableMonths = computed<string[]>(() => this.costByMonth().map((m) => m.period));

  monthBars = computed<MonthBar[]>(() => {
    const months = this.costByMonth();
    const max = Math.max(...months.map((m) => m.totalCost), 0);
    return months.map((m) => ({ ...m, heightPct: max > 0 ? (m.totalCost / max) * 100 : 0 }));
  });

  dayBars = computed<DayBar[]>(() => {
    const days = this.costByDay();
    const max = Math.max(...days.map((d) => d.totalCost), 0);
    return days.map((d) => ({ ...d, heightPct: max > 0 ? (d.totalCost / max) * 100 : 0 }));
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loadState.set('loading');
    Promise.all([
      firstValueFrom(this.reportingService.getCostByMonth()),
      firstValueFrom(this.reportingService.getCostByProviderAndService()),
    ])
      .then(([byMonth, byProviderAndService]) => {
        this.costByMonth.set(byMonth);
        this.costByProviderAndService.set(byProviderAndService);
        this.loadState.set('loaded');
        if (this.viewMode() === 'daily') {
          this.ensureSelectedMonth();
        }
      })
      .catch(() => this.loadState.set('error'));
  }

  setViewMode(mode: ViewMode): void {
    this.viewMode.set(mode);
    if (mode === 'daily') {
      this.ensureSelectedMonth();
    }
  }

  onMonthChange(month: string): void {
    this.selectedMonth.set(month);
    this.loadDay(month);
  }

  private ensureSelectedMonth(): void {
    if (this.selectedMonth() !== null) {
      return;
    }
    const months = this.availableMonths();
    const latest = months[months.length - 1] ?? null;
    if (latest) {
      this.selectedMonth.set(latest);
      this.loadDay(latest);
    }
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
}
