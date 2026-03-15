import { Component, signal, inject, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  private http = inject(HttpClient);
  message = signal<string>('Loading...');

  ngOnInit(): void {
    this.http.get('http://localhost:3000', { responseType: 'text' }).subscribe({
      next: (res) => this.message.set(res),
      error: () => this.message.set('Failed to connect to backend.')
    });
  }
}