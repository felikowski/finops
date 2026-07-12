import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { BillingAccountsService } from './billing-accounts.service';
import { BillingAccount, BillingAccountPull } from './billing-account.model';

type LoadState = 'loading' | 'loaded' | 'error';

type PullState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; rowsInserted: number }
  | { status: 'error'; message: string };

@Component({
  selector: 'app-billing-accounts',
  imports: [DatePipe],
  templateUrl: './billing-accounts.component.html',
  styleUrl: './billing-accounts.component.css',
})
export class BillingAccountsComponent implements OnInit {
  private billingAccountsService = inject(BillingAccountsService);

  accounts = signal<BillingAccount[]>([]);
  loadState = signal<LoadState>('loading');
  pullStates = signal<Record<string, PullState>>({});
  lastPulls = signal<Record<string, BillingAccountPull>>({});

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loadState.set('loading');
    this.billingAccountsService.list().subscribe({
      next: (accounts) => {
        this.accounts.set(accounts);
        this.loadState.set('loaded');
        accounts.forEach((account) => this.loadLastPull(account.id));
      },
      error: () => this.loadState.set('error'),
    });
  }

  pull(account: BillingAccount): void {
    this.setPullState(account.id, { status: 'loading' });
    this.billingAccountsService.pull(account.id).subscribe({
      next: ({ rowsInserted }) => {
        this.setPullState(account.id, { status: 'success', rowsInserted });
        this.load();
      },
      error: (err: HttpErrorResponse) => {
        const message = err.error?.message ?? 'Pull failed.';
        this.setPullState(account.id, { status: 'error', message });
        this.loadLastPull(account.id);
      },
    });
  }

  lastPull(accountId: string): BillingAccountPull | undefined {
    return this.lastPulls()[accountId];
  }

  pullState(accountId: string): PullState {
    return this.pullStates()[accountId] ?? { status: 'idle' };
  }

  isPulling(accountId: string): boolean {
    return this.pullState(accountId).status === 'loading';
  }

  private setPullState(accountId: string, state: PullState): void {
    this.pullStates.update((states) => ({ ...states, [accountId]: state }));
  }

  private loadLastPull(accountId: string): void {
    this.billingAccountsService.listPulls(accountId).subscribe({
      next: (pulls) => {
        if (pulls.length === 0) {
          return;
        }
        this.lastPulls.update((state) => ({ ...state, [accountId]: pulls[0] }));
      },
      error: () => {
        // Non-fatal — the "Last pull" column just falls back to "Never".
      },
    });
  }
}
