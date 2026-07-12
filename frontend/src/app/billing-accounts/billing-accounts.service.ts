import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RUNTIME_CONFIG } from '../runtime-config';
import { BillingAccount, BillingAccountPull, PullResult } from './billing-account.model';

@Injectable({ providedIn: 'root' })
export class BillingAccountsService {
  private http = inject(HttpClient);
  private runtimeConfig = inject(RUNTIME_CONFIG);

  list(): Observable<BillingAccount[]> {
    return this.http.get<BillingAccount[]>(`${this.runtimeConfig.apiBaseUrl}/billing-accounts`);
  }

  pull(id: string): Observable<PullResult> {
    return this.http.post<PullResult>(
      `${this.runtimeConfig.apiBaseUrl}/billing-accounts/${id}/pull`,
      {},
    );
  }

  listPulls(id: string): Observable<BillingAccountPull[]> {
    return this.http.get<BillingAccountPull[]>(
      `${this.runtimeConfig.apiBaseUrl}/billing-accounts/${id}/pulls`,
    );
  }
}
