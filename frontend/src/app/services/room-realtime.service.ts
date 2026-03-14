import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { first, timeout } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { RoomChatMessage, RoomResponse } from '../models/room.model';

export interface HostPositionResponse {
  requestId: string;
  positionSeconds: number;
  playing: boolean;
  currentTrackId: number | null;
  currentQueueItemId?: number | null;
}

const MAX_RECONNECT_ATTEMPTS = 5;
const INITIAL_RECONNECT_DELAY_MS = 1000;
const MAX_RECONNECT_DELAY_MS = 30000;

/**
 * WebSocket‑сервис для получения обновлений состояния комнаты в реальном времени.
 *
 * Подключается к /ws/rooms/{roomId}?token=JWT. Сервер проверяет токен и членство в комнате.
 * При обрыве соединения (не 4xxx) — ограниченное переподключение с backoff.
 */
@Injectable({
  providedIn: 'root'
})
export class RoomRealtimeService implements OnDestroy {
  private socket: WebSocket | null = null;
  private roomId: number | null = null;
  private state$ = new Subject<RoomResponse>();
  private chat$ = new Subject<RoomChatMessage>();
  private roomClosed$ = new Subject<number>();
  private positionResponse$ = new Subject<HostPositionResponse>();
  private getPositionRequest$ = new Subject<{ requestId: string }>();
  private explicitlyDisconnected = false;
  private reconnectAttempts = 0;
  private reconnectTimeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor(private authService: AuthService) {}

  connect(roomId: number): Observable<RoomResponse> {
    if (this.roomId === roomId && this.socket && this.socket.readyState === WebSocket.OPEN) {
      console.log('[RoomRealtimeService] reuse existing WebSocket for room', roomId);
      return this.state$.asObservable();
    }

    this.cancelReconnect();
    this.disconnect();

    this.explicitlyDisconnected = false;
    this.roomId = roomId;
    this.reconnectAttempts = 0;
    console.log('[RoomRealtimeService] connect() called for room', roomId);
    this.openSocket(roomId);
    return this.state$.asObservable();
  }

  private openSocket(roomId: number): void {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const token = this.authService.getToken();
    const url = token
      ? `${protocol}//${host}/ws/rooms/${roomId}?token=${encodeURIComponent(token)}`
      : `${protocol}//${host}/ws/rooms/${roomId}`;
    console.log('[RoomRealtimeService] opening WebSocket to', url.replace(/token=[^&]+/, 'token=***'));

    this.socket = new WebSocket(url);
    this.socket.onopen = () => {
      this.reconnectAttempts = 0;
      console.log('[RoomRealtimeService] WebSocket connected');
    };
    this.socket.onmessage = (event: MessageEvent<string>) => {
      console.log('[RoomRealtimeService] message received:', event.data);
      try {
        const data = JSON.parse(event.data) as any;
        if (data?.type === 'roomClosed' && typeof data.roomId === 'number') {
          try {
            this.socket?.close();
          } catch {
            // ignore
          }
          this.roomClosed$.next(data.roomId);
          this.clearSocket();
          return;
        }
        if (data?.type === 'getPositionRequest' && typeof data.requestId === 'string') {
          this.getPositionRequest$.next({ requestId: data.requestId });
          return;
        }
        if (data?.type === 'positionResponse' && typeof data.requestId === 'string') {
          this.positionResponse$.next({
            requestId: data.requestId,
            positionSeconds: Number(data.positionSeconds) || 0,
            playing: Boolean(data.playing),
            currentTrackId: data.currentTrackId ?? null,
            currentQueueItemId: data.currentQueueItemId ?? null
          });
          return;
        }
        if (data?.type === 'chat' && data.message) {
          this.chat$.next(data.message as RoomChatMessage);
        } else {
          const state: RoomResponse = data?.state ?? data;
          this.state$.next(state);
        }
      } catch (e) {
        console.error('[RoomRealtimeService] failed to parse message', e);
      }
    };
    this.socket.onclose = (event: CloseEvent) => {
      console.log('[RoomRealtimeService] WebSocket closed:', event.code, event.reason);
      const wasRoomId = this.roomId;
      this.clearSocket();
      if (!this.explicitlyDisconnected && wasRoomId != null && !this.isClientError(event.code)) {
        this.scheduleReconnect(wasRoomId);
      }
    };
    this.socket.onerror = () => {
      this.clearSocket();
    };
  }

  private isClientError(code: number): boolean {
    return code >= 4000 && code < 5000;
  }

  private clearSocket(): void {
    this.socket = null;
    this.roomId = null;
  }

  private scheduleReconnect(roomId: number): void {
    this.cancelReconnect();
    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.log('[RoomRealtimeService] max reconnect attempts reached');
      return;
    }
    const delay = Math.min(
      INITIAL_RECONNECT_DELAY_MS * Math.pow(2, this.reconnectAttempts),
      MAX_RECONNECT_DELAY_MS
    );
    this.reconnectAttempts++;
    console.log('[RoomRealtimeService] reconnecting in', delay, 'ms, attempt', this.reconnectAttempts);
    this.reconnectTimeoutId = setTimeout(() => {
      this.reconnectTimeoutId = null;
      this.roomId = roomId;
      this.openSocket(roomId);
    }, delay);
  }

  private cancelReconnect(): void {
    if (this.reconnectTimeoutId != null) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
  }

  disconnect(): void {
    this.explicitlyDisconnected = true;
    this.cancelReconnect();
    if (this.socket) {
      try {
        this.socket.close();
      } catch {
        // ignore
      }
    }
    this.clearSocket();
  }

  onChat(): Observable<RoomChatMessage> {
    return this.chat$.asObservable();
  }

  /** Событие «комната закрыта» (сервер удалил комнату). Передаётся roomId. */
  onRoomClosed(): Observable<number> {
    return this.roomClosed$.asObservable();
  }

  /** Запросить у хоста текущую позицию (для синхронизации при нажатии «Воспроизвести»). Таймаут 5 с. */
  requestPositionFromHost(): Observable<HostPositionResponse> {
    const requestId = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
    this.send({ type: 'getPosition', requestId });
    return this.positionResponse$.pipe(
      first((r: HostPositionResponse) => r.requestId === requestId),
      timeout(5000)
    );
  }

  /** Событие «хост запрашивает текущую позицию» — только хост должен ответить. */
  onGetPositionRequest(): Observable<{ requestId: string }> {
    return this.getPositionRequest$.asObservable();
  }

  /** Отправить текущую позицию (вызывает хост в ответ на getPositionRequest). */
  sendPositionResponse(requestId: string, data: Omit<HostPositionResponse, 'requestId'>): void {
    this.send({
      type: 'positionResponse',
      requestId,
      positionSeconds: data.positionSeconds,
      playing: data.playing,
      currentTrackId: data.currentTrackId,
      currentQueueItemId: data.currentQueueItemId ?? null
    });
  }

  private send(msg: object): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
    try {
      this.socket.send(JSON.stringify(msg));
    } catch {
      // ignore
    }
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}

