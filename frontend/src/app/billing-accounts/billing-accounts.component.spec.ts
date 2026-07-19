import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { BillingAccountsComponent } from './billing-accounts.component';
import { BillingAccount } from './billing-account.model';
import { DEFAULT_RUNTIME_CONFIG, RUNTIME_CONFIG } from '../runtime-config';

const account: BillingAccount = {
  id: 'acc-1',
  customerId: 'cust-1',
  provider: 'aws',
  displayName: 'Acme AWS',
  cloudAccountId: null,
  sourceConfig: { bucket: 'acme-billing', key: 'focus/export.csv', region: 'eu-central-1' },
  credentialRef: null,
  focusVersion: '1.2',
  enabled: true,
  lastIngestedAt: null,
  lastRowsInserted: null,
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-01T00:00:00.000Z',
};

describe('BillingAccountsComponent', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BillingAccountsComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: RUNTIME_CONFIG, useValue: DEFAULT_RUNTIME_CONFIG },
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  function expectListRequest() {
    return httpMock.expectOne(`${DEFAULT_RUNTIME_CONFIG.apiBaseUrl}/billing-accounts`);
  }

  function expectPullsRequest(accountId: string) {
    return httpMock.expectOne(`${DEFAULT_RUNTIME_CONFIG.apiBaseUrl}/billing-accounts/${accountId}/pulls`);
  }

  it('shows a loading message before the list resolves', () => {
    const fixture = TestBed.createComponent(BillingAccountsComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Loading billing accounts');
    expectListRequest().flush([]);
  });

  it('renders accounts in a table once loaded', () => {
    const fixture = TestBed.createComponent(BillingAccountsComponent);
    fixture.detectChanges();
    expectListRequest().flush([account]);
    expectPullsRequest(account.id).flush([]);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Acme AWS');
    expect(text).toContain('acme-billing/focus/export.csv');
    expect(text).toContain('Never');
  });

  it('shows the last recorded pull failure even after a reload', () => {
    const fixture = TestBed.createComponent(BillingAccountsComponent);
    fixture.detectChanges();
    expectListRequest().flush([account]);
    expectPullsRequest(account.id).flush([
      {
        id: 'pull-1',
        billingAccountId: account.id,
        startedAt: '2026-07-13T00:00:00.000Z',
        finishedAt: '2026-07-13T00:00:01.000Z',
        status: 'error',
        rowsInserted: null,
        errorMessage: 'Failed to pull from s3://acme-billing/focus/export.csv: bucket not found',
        createdAt: '2026-07-13T00:00:01.000Z',
      },
    ]);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'Failed to pull from s3://acme-billing/focus/export.csv: bucket not found',
    );
  });

  it('shows an empty state when there are no accounts', () => {
    const fixture = TestBed.createComponent(BillingAccountsComponent);
    fixture.detectChanges();
    expectListRequest().flush([]);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No billing accounts registered yet.');
  });

  it('shows an error state when the list request fails', () => {
    const fixture = TestBed.createComponent(BillingAccountsComponent);
    fixture.detectChanges();
    expectListRequest().error(new ProgressEvent('network error'));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Failed to load billing accounts.');
  });

  it('pulls an account and shows rows inserted, then refreshes the list', () => {
    const fixture = TestBed.createComponent(BillingAccountsComponent);
    fixture.detectChanges();
    expectListRequest().flush([account]);
    expectPullsRequest(account.id).flush([]);
    fixture.detectChanges();

    fixture.componentInstance.pull(account);
    expect(fixture.componentInstance.isPulling(account.id)).toBe(true);

    httpMock
      .expectOne(`${DEFAULT_RUNTIME_CONFIG.apiBaseUrl}/billing-accounts/${account.id}/pull`)
      .flush({ rowsInserted: 42 });

    expectListRequest().flush([{ ...account, lastIngestedAt: '2026-07-12T00:00:00.000Z', lastRowsInserted: 42 }]);
    expectPullsRequest(account.id).flush([
      {
        id: 'pull-2',
        billingAccountId: account.id,
        startedAt: '2026-07-12T00:00:00.000Z',
        finishedAt: '2026-07-12T00:00:01.000Z',
        status: 'success',
        rowsInserted: 42,
        errorMessage: null,
        createdAt: '2026-07-12T00:00:01.000Z',
      },
    ]);
    fixture.detectChanges();

    expect(fixture.componentInstance.isPulling(account.id)).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('Inserted 42 rows');
  });

  it('shows the backend error message when a pull fails', () => {
    const fixture = TestBed.createComponent(BillingAccountsComponent);
    fixture.detectChanges();
    expectListRequest().flush([account]);
    expectPullsRequest(account.id).flush([]);
    fixture.detectChanges();

    fixture.componentInstance.pull(account);
    httpMock
      .expectOne(`${DEFAULT_RUNTIME_CONFIG.apiBaseUrl}/billing-accounts/${account.id}/pull`)
      .flush(
        { message: 'Failed to pull from s3://acme-billing/focus/export.csv: bucket not found' },
        { status: 502, statusText: 'Bad Gateway' },
      );
    expectPullsRequest(account.id).flush([
      {
        id: 'pull-3',
        billingAccountId: account.id,
        startedAt: '2026-07-12T00:00:00.000Z',
        finishedAt: '2026-07-12T00:00:01.000Z',
        status: 'error',
        rowsInserted: null,
        errorMessage: 'Failed to pull from s3://acme-billing/focus/export.csv: bucket not found',
        createdAt: '2026-07-12T00:00:01.000Z',
      },
    ]);
    fixture.detectChanges();

    expect(fixture.componentInstance.isPulling(account.id)).toBe(false);
    expect(fixture.nativeElement.textContent).toContain(
      'Failed to pull from s3://acme-billing/focus/export.csv: bucket not found',
    );
  });
});
