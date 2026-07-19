import { Routes } from '@angular/router';
import { BillingAccountsComponent } from './billing-accounts/billing-accounts.component';
import { ReportingComponent } from './reporting/reporting.component';
import { authGuard } from './auth/auth.guard';

export const routes: Routes = [
  { path: '', component: ReportingComponent, canActivate: [authGuard] },
  { path: 'billing-accounts', component: BillingAccountsComponent, canActivate: [authGuard] },
];
