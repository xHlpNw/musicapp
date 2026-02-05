import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { RegisterOverlayService } from '../../services/register-overlay.service';
import { LoginOverlayService } from '../../services/login-overlay.service';

function passwordMatchValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const parent = control.parent;
    if (!parent) return null;
    const password = parent.get('password')?.value;
    const confirm = control.value;
    return password === confirm ? null : { passwordMismatch: true };
  };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  errorMessage = '';
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private registerOverlay: RegisterOverlayService,
    private loginOverlay: LoginOverlayService
  ) {
    this.registerForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
      password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(100)]],
      confirmPassword: ['', [Validators.required, passwordMatchValidator()]]
    });
  }

  ngOnInit(): void {
    this.registerForm.get('password')?.valueChanges.subscribe(() => {
      this.confirmPassword?.updateValueAndValidity();
    });
  }

  get username() {
    return this.registerForm.get('username');
  }

  get email() {
    return this.registerForm.get('email');
  }

  get password() {
    return this.registerForm.get('password');
  }

  get confirmPassword() {
    return this.registerForm.get('confirmPassword');
  }

  close(): void {
    this.registerOverlay.close();
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }

  openLogin(event: Event): void {
    event.preventDefault();
    this.registerOverlay.close();
    this.loginOverlay.open();
  }

  getUsernameError(): string {
    const c = this.username;
    if (c?.errors?.['required']) return 'Обязательное поле';
    if (c?.errors?.['minlength']) return 'Минимум 2 символа';
    if (c?.errors?.['maxlength']) return 'Не более 50 символов';
    return 'Неверное значение';
  }

  getEmailError(): string {
    const c = this.email;
    if (c?.errors?.['required']) return 'Обязательное поле';
    if (c?.errors?.['email']) return 'Введите корректный email';
    return 'Неверное значение';
  }

  getPasswordError(): string {
    const c = this.password;
    if (c?.errors?.['required']) return 'Обязательное поле';
    if (c?.errors?.['minlength']) return 'Минимум 6 символов';
    return 'Неверное значение';
  }

  getConfirmPasswordError(): string {
    const c = this.confirmPassword;
    if (c?.errors?.['required']) return 'Обязательное поле';
    if (c?.errors?.['passwordMismatch']) return 'Пароли не совпадают';
    return 'Неверное значение';
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const { confirmPassword: _, ...payload } = this.registerForm.value;
    this.authService.register(payload).subscribe({
      next: () => {
        this.registerOverlay.close();
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.isLoading = false;
        if (error.status === 409) {
          this.errorMessage = error.error?.error || 'Пользователь с таким email уже существует';
        } else if (error.status === 400 && error.error?.details) {
          this.errorMessage = Object.values(error.error.details).join(', ');
        } else {
          this.errorMessage = 'Ошибка регистрации. Попробуйте ещё раз.';
        }
      }
    });
  }
}
