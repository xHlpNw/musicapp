import { Component } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { PlayerComponent } from './components/player/player.component';
import { AddToPlaylistOverlayComponent } from './components/add-to-playlist-overlay/add-to-playlist-overlay.component';
import { LoginOverlayService } from './services/login-overlay.service';
import { RegisterOverlayService } from './services/register-overlay.service';
import { PlayerService } from './services/player.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, AsyncPipe, LoginComponent, RegisterComponent, PlayerComponent, AddToPlaylistOverlayComponent],
  template: `
    <router-outlet></router-outlet>
    @if (playerService.currentTrack$ | async) {
      <app-player />
    }
    <app-add-to-playlist-overlay />
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
    public registerOverlay: RegisterOverlayService,
    public playerService: PlayerService
  ) {}
}
