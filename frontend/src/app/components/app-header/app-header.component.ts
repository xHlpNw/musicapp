import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { LoginOverlayService } from '../../services/login-overlay.service';
import { LoginResponse } from '../../models/auth.model';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './app-header.component.html',
  styleUrls: ['./app-header.component.css']
})
export class AppHeaderComponent {
  @Input() searchValue = '';
  @Output() searchValueChange = new EventEmitter<string>();
  @Input() searchReadonly = true;

  constructor(
    public authService: AuthService,
    private loginOverlay: LoginOverlayService,
    private router: Router
  ) {}

  openLogin(event: Event): void {
    event.preventDefault();
    this.loginOverlay.open();
  }

  getAvatarUrl(user: LoginResponse): string | null {
    if (!user?.avatarUrl) return null;
    const base = user.avatarUrl.startsWith('http') ? user.avatarUrl : '/api/covers/' + user.avatarUrl;
    const sep = base.includes('?') ? '&' : '?';
    return user.avatarVersion ? `${base}${sep}v=${user.avatarVersion}` : base;
  }

  getInitial(user: LoginResponse): string {
    return user?.username?.charAt(0)?.toUpperCase() ?? '?';
  }

  onSearchInput(value: string): void {
    this.searchValueChange.emit(value);
  }

  onSearchEnter(event: Event): void {
    if (this.searchReadonly) return;
    event.preventDefault();
    const q = this.searchValue?.trim() || '';
    this.router.navigate(['/search'], { queryParams: q ? { q } : {} });
  }
}
