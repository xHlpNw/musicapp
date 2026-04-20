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

export interface PositionTick {
  positionSeconds: number;
  playing: boolean;
  currentTrackId: number | null;
  currentQueueItemId?: number | null;
  serverTimeMs?: number;
}

const MAX_RECONNECT_ATTEMPTS = 5;
const INITIAL_RECONNECT_DELAY_MS = 1000;
const MAX_RECONNECT_DELAY_MS = 30000;

/**
 * WebSocket-сервис для получения обновлений состояния комнаты в реальном времени.
 *
 * Подключается к /ws/rooms/{roomId}?token=JWT.
 * При обрыве соединения (не 4xxx) — ограниченное переподключение с backoff.
 *
 * Протокол:
 * - {type:"stateSnapshot", revision:N, payload:{RoomResponse}} — полное состояние,
 *   применяется только если revision > lastAppliedRevision.
 * - {type:"position", ...} — тик позиции от хоста.
 * - {type:"chat", message:{...}} — чат-сообщение.
 * - {type:"roomClosed", roomId:N} — комната закрыта.
 * - {type:"getPositionRequest", requestId:S} — сервер просит хоста ответить на позицию.
 * - {type:"positionResponse", requestId:S, ...} — ответ хоста конкретному клиенту.
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
  private positionTick$ = new Subject<PositionTick>();

  private explicitlyDisconnected = false;
  private reconnectAttempts = 0;
  private reconnectTimeoutId: ReturnType<typeof setTimeout> | null = null;

  /** Последняя применённая revision — отбрасываем более старые stateSnapshot. */
  private lastAppliedRevision = -1;

  constructor(private authService: AuthService) {}

  connect(roomId: number): Observable<RoomResponse> {
    if (this.roomId === roomId && this.socket && this.socket.readyState === WebSocket.OPEN) {
      return this.state$.asObservable();
    }

    this.cancelReconnect();
    this.disconnect();

    this.explicitlyDisconnected = false;
    this.roomId = roomId;
    this.reconnectAttempts = 0;
    this.lastAppliedRevision = -1;
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

    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      this.reconnectAttempts = 0;
    };

    this.socket.onmessage = (event: MessageEvent<string>) => {
      try {
        const data = JSON.parse(event.data) as Record<string, unknown>;
        const type = data['type'] as string | undefined;

        switch (type) {
          case 'stateSnapshot': {
            const revision = typeof data['revision'] === 'number' ? data['revision'] : -1;
            if (revision <= this.lastAppliedRevision) return;
            this.lastAppliedRevision = revision;
            this.state$.next(data['payload'] as RoomResponse);
            return;
          }

          case 'roomClosed':
            try { this.socket?.close(); } catch { /* ignore */ }
            this.roomClosed$.next(data['roomId'] as number);
            this.clearSocket();
            return;

          case 'getPositionRequest':
            if (typeof data['requestId'] === 'string') {
              this.getPositionRequest$.next({ requestId: data['requestId'] });
            }
            return;

          case 'positionResponse':
            if (typeof data['requestId'] === 'string') {
              this.positionResponse$.next({
                requestId: data['requestId'],
                positionSeconds: Number(data['positionSeconds']) || 0,
                playing: Boolean(data['playing']),
                currentTrackId: (data['currentTrackId'] as number | null) ?? null,
                currentQueueItemId: (data['currentQueueItemId'] as number | null) ?? null
              });
            }
            return;

          case 'position':
            this.positionTick$.next({
              positionSeconds: Number(data['positionSeconds']) || 0,
              playing: Boolean(data['playing']),
              currentTrackId: (data['currentTrackId'] as number | null) ?? null,
              currentQueueItemId: (data['currentQueueItemId'] as number | null) ?? null,
              serverTimeMs: typeof data['serverTimeMs'] === 'number' ? data['serverTimeMs'] : undefined
            });
            return;

          case 'chat':
            if (data['message']) {
              this.chat$.next(data['message'] as RoomChatMessage);
            }
            return;

          default:
            return;
        }
      } catch {
        // malformed message — ignore
      }
    };

    this.socket.onclose = (event: CloseEvent) => {
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
    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) return;
    const delay = Math.min(
      INITIAL_RECONNECT_DELAY_MS * Math.pow(2, this.reconnectAttempts),
      MAX_RECONNECT_DELAY_MS
    );
    this.reconnectAttempts++;
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
      try { this.socket.close(); } catch { /* ignore */ }
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

  /**
   * Запросить у хоста текущую позицию (для синхронизации при нажатии «Воспроизвести»).
   * Таймаут 5 секунд. При истечении — вернуть ошибку для fallback через HTTP.
   */
  requestPositionFromHost(): Observable<HostPositionResponse> {
    const requestId = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
    this.send({ type: 'getPosition', requestId });
    return this.positionResponse$.pipe(
      first((r: HostPositionResponse) => r.requestId === requestId),
      timeout(5000)
    );
  }

  /** Событие «сервер просит хоста ответить» — хост должен вызвать sendPositionResponse. */
  onGetPositionRequest(): Observable<{ requestId: string }> {
    return this.getPositionRequest$.asObservable();
  }

  /** Периодические тики позиции от хоста (анти-дрифт). */
  onPositionTick(): Observable<PositionTick> {
    return this.positionTick$.asObservable();
  }

  /** Хост отвечает на getPositionRequest. */
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

  /** Хост периодически шлёт тик позиции при playing=true. */
  sendPositionTick(data: Omit<PositionTick, 'serverTimeMs'>): void {
    this.send({
      type: 'positionTick',
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
    } catch { /* ignore */ }
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
