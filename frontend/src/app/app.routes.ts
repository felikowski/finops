import { Routes } from '@angular/router';
import { BillingAccountsComponent } from './billing-accounts/billing-accounts.component';
import { authGuard } from './auth/auth.guard';

export const routes: Routes = [{ path: '', component: BillingAccountsComponent, canActivate: [authGuard] }];
