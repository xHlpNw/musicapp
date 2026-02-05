import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { LoginResponse } from '../../models/auth.model';
import { SideNavComponent } from '../side-nav/side-nav.component';

type ProfileModal = 'name' | 'avatar' | 'password' | 'logout' | null;

const AVATAR_SIZE = 256;

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, FormsModule, SideNavComponent],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent {
  activeModal: ProfileModal = null;
  editNameValue = '';
  editPasswordCurrent = '';
  editPasswordNew = '';
  editPasswordConfirm = '';
  modalError = '';
  modalSaving = false;

  /** Рисование аватара */
  avatarDrawColor = '#EDEDED';
  avatarDrawSize = 6;
  private isDrawing = false;
  private lastX = 0;
  private lastY = 0;
  private boundPointerMove = (e: PointerEvent) => this.onAvatarCanvasPointerMove(e);
  private boundPointerUp = () => this.onAvatarCanvasPointerUp();

  constructor(
    public authService: AuthService,
    private router: Router
  ) {}

  getDisplayName(user: LoginResponse | null): string {
    return user?.username ?? 'Пользователь';
  }

  getAvatarUrl(user: LoginResponse | null): string | null {
    if (!user?.avatarUrl) return null;
    const base = user.avatarUrl.startsWith('http') ? user.avatarUrl : '/api/covers/' + user.avatarUrl;
    const sep = base.includes('?') ? '&' : '?';
    return user.avatarVersion ? `${base}${sep}v=${user.avatarVersion}` : base;
  }

  getInitial(user: LoginResponse | null): string {
    if (!user?.username) return '?';
    return user.username.charAt(0).toUpperCase();
  }

  editProfile(event: Event, user: LoginResponse | null): void {
    event.preventDefault();
    this.modalError = '';
    this.editNameValue = user?.username ?? '';
    this.activeModal = 'name';
  }

  changeName(user: LoginResponse | null): void {
    this.modalError = '';
    this.editNameValue = user?.username ?? '';
    this.activeModal = 'name';
  }

  changeAvatar(user: LoginResponse | null): void {
    this.modalError = '';
    this.activeModal = 'avatar';
    const previousAvatarUrl = user ? this.getAvatarUrl(user) : null;
    setTimeout(() => this.initAvatarCanvas(previousAvatarUrl), 0);
  }

  changePassword(): void {
    this.editPasswordCurrent = '';
    this.editPasswordNew = '';
    this.editPasswordConfirm = '';
    this.modalError = '';
    this.activeModal = 'password';
  }

  confirmLogout(): void {
    this.activeModal = 'logout';
  }

  closeModal(event?: Event): void {
    if (event && event.target !== event.currentTarget) return;
    this.onAvatarCanvasPointerUp();
    this.activeModal = null;
    this.modalError = '';
  }

  saveName(): void {
    const username = this.editNameValue?.trim();
    if (!username) {
      this.modalError = 'Введите имя';
      return;
    }
    this.modalError = '';
    this.modalSaving = true;
    this.authService.updateProfile({ username }).subscribe({
      next: () => {
        this.modalSaving = false;
        this.activeModal = null;
      },
      error: (err) => {
        this.modalSaving = false;
        this.modalError = err.error?.error || 'Не удалось сохранить имя';
      }
    });
  }

  initAvatarCanvas(previousAvatarUrl?: string | null): void {
    const canvas = document.getElementById('avatarCanvas') as HTMLCanvasElement | null;
    if (!canvas) return;
    const size = AVATAR_SIZE;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#1C1F24';
    ctx.fillRect(0, 0, size, size);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (previousAvatarUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        ctx.drawImage(img, 0, 0, size, size);
      };
      img.onerror = () => {
        // Оставляем пустой фон при ошибке загрузки
      };
      img.src = previousAvatarUrl;
    }
  }

  onAvatarCanvasPointerDown(event: PointerEvent): void {
    const canvas = document.getElementById('avatarCanvas') as HTMLCanvasElement | null;
    if (!canvas) return;
    event.preventDefault();
    this.isDrawing = true;
    const rect = canvas.getBoundingClientRect();
    const scale = canvas.width / rect.width;
    this.lastX = (event.clientX - rect.left) * scale;
    this.lastY = (event.clientY - rect.top) * scale;
    document.addEventListener('pointermove', this.boundPointerMove);
    document.addEventListener('pointerup', this.boundPointerUp);
  }

  onAvatarCanvasPointerMove(event: PointerEvent): void {
    if (!this.isDrawing) return;
    const canvas = document.getElementById('avatarCanvas') as HTMLCanvasElement | null;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const scale = canvas.width / rect.width;
    const x = (event.clientX - rect.left) * scale;
    const y = (event.clientY - rect.top) * scale;
    ctx.strokeStyle = this.avatarDrawColor;
    ctx.lineWidth = this.avatarDrawSize;
    ctx.beginPath();
    ctx.moveTo(this.lastX, this.lastY);
    ctx.lineTo(x, y);
    ctx.stroke();
    this.lastX = x;
    this.lastY = y;
  }

  onAvatarCanvasPointerUp(): void {
    this.isDrawing = false;
    document.removeEventListener('pointermove', this.boundPointerMove);
    document.removeEventListener('pointerup', this.boundPointerUp);
  }

  onAvatarCanvasPointerLeave(): void {
    if (this.isDrawing) this.onAvatarCanvasPointerUp();
  }

  clearAvatarCanvas(): void {
    this.initAvatarCanvas();
  }

  resetAvatarToDefault(): void {
    this.modalError = '';
    this.modalSaving = true;
    this.authService.clearAvatar().subscribe({
      next: () => {
        this.modalSaving = false;
        this.activeModal = null;
      },
      error: (err) => {
        this.modalSaving = false;
        this.modalError = err.error?.error || 'Не удалось сбросить аватар';
      }
    });
  }

  saveAvatar(): void {
    const canvas = document.getElementById('avatarCanvas') as HTMLCanvasElement | null;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    this.modalError = '';
    this.modalSaving = true;
    this.authService.updateAvatar(dataUrl).subscribe({
      next: () => {
        this.modalSaving = false;
        this.activeModal = null;
      },
      error: (err) => {
        this.modalSaving = false;
        this.modalError = err.error?.error || 'Не удалось сохранить аватар';
      }
    });
  }

  savePassword(): void {
    if (!this.editPasswordCurrent?.trim()) {
      this.modalError = 'Введите текущий пароль';
      return;
    }
    if (!this.editPasswordNew?.trim()) {
      this.modalError = 'Введите новый пароль';
      return;
    }
    if (this.editPasswordNew.length < 6) {
      this.modalError = 'Новый пароль не менее 6 символов';
      return;
    }
    if (this.editPasswordNew !== this.editPasswordConfirm) {
      this.modalError = 'Пароли не совпадают';
      return;
    }
    this.modalError = '';
    this.modalSaving = true;
    this.authService.updatePassword({
      currentPassword: this.editPasswordCurrent,
      newPassword: this.editPasswordNew
    }).subscribe({
      next: () => {
        this.modalSaving = false;
        this.activeModal = null;
      },
      error: (err) => {
        this.modalSaving = false;
        this.modalError = err.error?.error || 'Не удалось сменить пароль';
      }
    });
  }

  doLogout(): void {
    this.activeModal = null;
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
