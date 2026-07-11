import { Component, signal, inject, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RUNTIME_CONFIG } from './runtime-config';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  private http = inject(HttpClient);
  private runtimeConfig = inject(RUNTIME_CONFIG);
  message = signal<string>('Loading...');

  ngOnInit(): void {
    this.http.get(this.runtimeConfig.apiBaseUrl, { responseType: 'text' }).subscribe({
      next: (res) => this.message.set(res),
      error: () => this.message.set('Failed to connect to backend.')
    });
  }
}
