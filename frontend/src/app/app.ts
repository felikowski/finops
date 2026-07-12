import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { OAuthService } from 'angular-oauth2-oidc';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private oauthService = inject(OAuthService);

  get userEmail(): string | undefined {
    return this.oauthService.getIdentityClaims()?.['email'];
  }

  logout(): void {
    this.oauthService.logOut();
  }
}
