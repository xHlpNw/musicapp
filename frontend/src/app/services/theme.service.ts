import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type AppTheme = 'dark' | 'light';

const THEME_STORAGE_KEY = 'app_theme';
const DEFAULT_THEME: AppTheme = 'dark';

/**
 * Управляет темой приложения (тёмная/светлая).
 *
 * Тема применяется к корневому элементу <html> через атрибут data-theme,
 * а CSS-переменные в global styles.css автоматически переключают палитру.
 * Выбор темы сохраняется в localStorage и восстанавливается при следующем запуске.
 */
@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly themeSubject = new BehaviorSubject<AppTheme>(this.readInitialTheme());
  public readonly theme$: Observable<AppTheme> = this.themeSubject.asObservable();

  constructor() {
    // Применяем сохранённую тему сразу при создании сервиса (он providedIn: 'root',
    // поэтому будет создан до первого рендера компонентов).
    this.applyTheme(this.themeSubject.value);
  }

  /** Текущее значение темы. */
  getTheme(): AppTheme {
    return this.themeSubject.value;
  }

  /** Явно установить тему. */
  setTheme(theme: AppTheme): void {
    if (theme !== this.themeSubject.value) {
      this.themeSubject.next(theme);
      this.persistTheme(theme);
    }
    this.applyTheme(theme);
  }

  /** Переключить между светлой и тёмной темой. */
  toggleTheme(): AppTheme {
    const next: AppTheme = this.themeSubject.value === 'dark' ? 'light' : 'dark';
    this.setTheme(next);
    return next;
  }

  /** Удобный геттер для шаблонов. */
  isLight(): boolean {
    return this.themeSubject.value === 'light';
  }

  private applyTheme(theme: AppTheme): void {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
  }

  private persistTheme(theme: AppTheme): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
      }
    } catch {
      // Игнорируем ошибки доступа к localStorage (приватный режим и т.п.).
    }
  }

  private readInitialTheme(): AppTheme {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(THEME_STORAGE_KEY);
        if (stored === 'light' || stored === 'dark') {
          return stored;
        }
      }
    } catch {
      // ignore
    }
    return DEFAULT_THEME;
  }
}
