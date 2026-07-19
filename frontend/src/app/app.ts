import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { OAuthService } from 'angular-oauth2-oidc';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
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
