import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { ReportingService } from './reporting.service';
import { CostByMonth, CostByProviderAndService } from './reporting.model';

type LoadState = 'loading' | 'loaded' | 'error';

interface MonthBar extends CostByMonth {
  /** Bar height as a percentage of the tallest month, for the CSS bar chart. */
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

  monthBars = computed<MonthBar[]>(() => {
    const months = this.costByMonth();
    const max = Math.max(...months.map((m) => m.totalCost), 0);
    return months.map((m) => ({ ...m, heightPct: max > 0 ? (m.totalCost / max) * 100 : 0 }));
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
      })
      .catch(() => this.loadState.set('error'));
  }
}
