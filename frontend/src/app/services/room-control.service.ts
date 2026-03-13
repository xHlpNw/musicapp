import { Injectable } from '@angular/core';

export interface RoomControlCallbacks {
  previous: () => void;
  next: () => void;
  playPause: () => void;
  seekTo?: (positionSeconds: number) => void;
}

/**
 * Позволяет плееру управлять воспроизведением комнаты, когда пользователь — хост.
 * Страница комнаты регистрирует колбэки при входе (хост), плеер вызывает их по кнопкам.
 */
@Injectable({
  providedIn: 'root'
})
export class RoomControlService {
  private callbacks: RoomControlCallbacks | null = null;

  register(callbacks: RoomControlCallbacks): void {
    this.callbacks = callbacks;
  }

  unregister(): void {
    this.callbacks = null;
  }

  hasControl(): boolean {
    return this.callbacks != null;
  }

  previous(): void {
    this.callbacks?.previous();
  }

  next(): void {
    this.callbacks?.next();
  }

  playPause(): void {
    this.callbacks?.playPause();
  }

  seekTo(positionSeconds: number): void {
    this.callbacks?.seekTo?.(positionSeconds);
  }
}
