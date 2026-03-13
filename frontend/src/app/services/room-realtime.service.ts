import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { RoomChatMessage, RoomResponse } from '../models/room.model';

/**
 * WebSocket‑сервис для получения обновлений состояния комнаты в реальном времени.
 *
 * Подключается к endpoint'у /ws/rooms/{roomId} и рассылает приходящие
 * сообщения (RoomResponse) подписчикам.
 */
@Injectable({
  providedIn: 'root'
})
export class RoomRealtimeService implements OnDestroy {
  private socket: WebSocket | null = null;
  private roomId: number | null = null;
  private state$ = new Subject<RoomResponse>();
  private chat$ = new Subject<RoomChatMessage>();

  connect(roomId: number): Observable<RoomResponse> {
    if (this.roomId === roomId && this.socket && this.socket.readyState === WebSocket.OPEN) {
      console.log('[RoomRealtimeService] reuse existing WebSocket for room', roomId);
      return this.state$.asObservable();
    }

    this.disconnect();

    this.roomId = roomId;
    console.log('[RoomRealtimeService] connect() called for room', roomId);
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const url = `${protocol}//${host}/ws/rooms/${roomId}`;
    console.log('[RoomRealtimeService] opening WebSocket to', url);

    this.socket = new WebSocket(url);
    // Для отладки: покажем успешное подключение/ошибки в консоли.
    this.socket.onopen = () => {
      console.log('[RoomRealtimeService] WebSocket connected:', url);
    };
    this.socket.onmessage = (event: MessageEvent<string>) => {
      console.log('[RoomRealtimeService] message received:', event.data);
      try {
        const data = JSON.parse(event.data) as any;
        if (data && data.type === 'chat' && data.message) {
          this.chat$.next(data.message as RoomChatMessage);
        } else {
          // Обратная совместимость: состояние комнаты может приходить как чистый RoomResponse
          // (без поля type) или в будущем как { type: 'state', state: RoomResponse }.
          const state: RoomResponse = data.state ?? data;
          this.state$.next(state);
        }
      } catch (e) {
        console.error('[RoomRealtimeService] failed to parse message', e);
      }
    };
    this.socket.onclose = (event: CloseEvent) => {
      console.log('[RoomRealtimeService] WebSocket closed:', event.code, event.reason);
      this.socket = null;
      this.roomId = null;
    };
    this.socket.onerror = (err: Event) => {
      console.error('[RoomRealtimeService] WebSocket error:', err);
      // при ошибке просто закрываем соединение; повторное подключение можно будет инициировать позже
      this.disconnect();
    };

    return this.state$.asObservable();
  }

  disconnect(): void {
    if (this.socket) {
      try {
        this.socket.close();
      } catch {
        // ignore
      }
    }
    this.socket = null;
    this.roomId = null;
  }

  onChat(): Observable<RoomChatMessage> {
    return this.chat$.asObservable();
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}

