import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RUNTIME_CONFIG } from '../runtime-config';
import { CostByCategoryAndProvider, CostByDay, CostByMonth } from './reporting.model';

@Injectable({ providedIn: 'root' })
export class ReportingService {
  private http = inject(HttpClient);
  private runtimeConfig = inject(RUNTIME_CONFIG);

  getCostByMonth(): Observable<CostByMonth[]> {
    return this.http.get<CostByMonth[]>(`${this.runtimeConfig.apiBaseUrl}/reporting/cost-by-month`);
  }

  getCostByCategoryAndProvider(): Observable<CostByCategoryAndProvider[]> {
    return this.http.get<CostByCategoryAndProvider[]>(
      `${this.runtimeConfig.apiBaseUrl}/reporting/cost-by-category-provider`,
    );
  }

  getCostByDay(month: string): Observable<CostByDay[]> {
    return this.http.get<CostByDay[]>(`${this.runtimeConfig.apiBaseUrl}/reporting/cost-by-day`, {
      params: new HttpParams().set('month', month),
    });
  }
}
