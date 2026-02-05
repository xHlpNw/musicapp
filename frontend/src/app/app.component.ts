import { Component } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { LoginOverlayService } from './services/login-overlay.service';
import { RegisterOverlayService } from './services/register-overlay.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, AsyncPipe, LoginComponent, RegisterComponent],
  template: `
    <router-outlet></router-outlet>
    @if (loginOverlay.isOpen$ | async) {
      <app-login />
    }
    @if (registerOverlay.isOpen$ | async) {
      <app-register />
    }
  `,
  styles: []
})
export class AppComponent {
  constructor(
    public loginOverlay: LoginOverlayService,
    public registerOverlay: RegisterOverlayService
  ) {}
}
