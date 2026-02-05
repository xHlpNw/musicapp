import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { LoginResponse } from '../../models/auth.model';

type ProfileModal = 'name' | 'avatar' | 'password' | 'logout' | null;

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, FormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent {
  activeModal: ProfileModal = null;
  editNameValue = '';
  editAvatarValue = '';
  editPasswordCurrent = '';
  editPasswordNew = '';
  editPasswordConfirm = '';
  modalError = '';
  modalSaving = false;

  constructor(
    public authService: AuthService,
    private router: Router
  ) {}

  getDisplayName(user: LoginResponse | null): string {
    return user?.username ?? 'Пользователь';
  }

  getAvatarUrl(user: LoginResponse | null): string | null {
    if (!user?.avatarUrl) return null;
    return user.avatarUrl.startsWith('http') ? user.avatarUrl : '/api/covers/' + user.avatarUrl;
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
    this.editAvatarValue = user?.avatarUrl ?? '';
    this.activeModal = 'avatar';
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

  saveAvatar(): void {
    // TODO: API смена аватара, когда будет endpoint
    this.activeModal = null;
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
