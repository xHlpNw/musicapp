import { Component, OnInit, OnDestroy, AfterViewChecked, inject, ViewChild, ElementRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, merge } from 'rxjs';
import { takeUntil, catchError, timeout } from 'rxjs/operators';
import { of } from 'rxjs';
import { SideNavComponent } from '../side-nav/side-nav.component';
import { AppHeaderComponent } from '../app-header/app-header.component';
import { AuthService } from '../../services/auth.service';
import { PlayerService } from '../../services/player.service';
import { RoomService } from '../../services/room.service';
import { RoomControlService } from '../../services/room-control.service';
import { TrackService } from '../../services/track.service';
import { FavoritesService } from '../../services/favorites.service';
import { RoomRealtimeService, HostPositionResponse, PositionTick } from '../../services/room-realtime.service';
import { RoomChatMessage, RoomResponse, RoomQueueItemInfo } from '../../models/room.model';
import { TrackResponse } from '../../models/track.model';
import { RoomSettingsOverlayComponent } from '../room-settings-overlay/room-settings-overlay.component';

export interface ChatMessageData {
  userId: number;
  username: string;
  isHost: boolean;
  text: string;
  time: Date;
}

@Component({
  selector: 'app-room-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SideNavComponent, AppHeaderComponent, RoomSettingsOverlayComponent],
  templateUrl: './room-detail.component.html',
  styleUrls: ['./room-detail.component.css']
})
export class RoomDetailComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('queueScrollRef') queueScrollRef?: ElementRef<HTMLElement>;
  @ViewChild('chatScroll') chatScrollRef?: ElementRef<HTMLElement>;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private playerService = inject<PlayerService>(PlayerService);
  private roomService = inject(RoomService);
  private roomControlService = inject(RoomControlService);
  private roomRealtimeService = inject(RoomRealtimeService);
  private trackService = inject(TrackService);
  private favoritesService = inject(FavoritesService);
  private ngZone = inject(NgZone);
  private destroy$ = new Subject<void>();
  /** Отмена предыдущих подписок на realtime при повторном вызове subscribeToRealtime (например при повторном loadRoom). */
  private realtimeUnsubscribe$ = new Subject<void>();

  /** После обновления очереди/комнаты — прокрутить список так, чтобы текущий трек был первым (сверху). */
  private needScrollQueueToCurrent = false;
  /** Прокрутить чат к последнему сообщению после следующего цикла отрисовки. */
  private needScrollChatToBottom = false;
  /** Таймер повторной попытки запуска воспроизведения после загрузки (обход гонки с потоком/автовоспроизведением). */
  private playRetryTimeoutId: ReturnType<typeof setTimeout> | null = null;
  /** Периодические тики позиции от хоста (анти-дрифт). */
  private positionTickIntervalId: ReturnType<typeof setInterval> | null = null;

  room: RoomResponse | null = null;
  /** Показать кнопку «Присоединиться» (пользователь не участник). */
  needJoin = false;
  showSettingsOverlay = false;
  /** Оверлей «Добавить трек в очередь». */
  showAddToQueueOverlay = false;
  addToQueueSearchQuery = '';
  /** Треки из избранного (показываются, когда поле поиска пустое). */
  addToQueueFavoriteTracks: TrackResponse[] = [];
  addToQueueFavoritesLoading = false;
  /** Результаты поиска (показываются после ввода запроса). */
  addToQueueTracks: TrackResponse[] = [];
  addToQueueLoading = false;
  addToQueueAddingId: number | null = null;
  chatMessages: ChatMessageData[] = [];
  chatInput = '';
  isLoading = true;
  isJoining = false;
  error = '';
  hasActiveTrack = false;
  currentUserId: number | null = null;
  /** Состояние воспроизведения плеера (для отображения кнопки «Воспроизвести» при блокировке автовоспроизведения). */
  isPlayerPlaying = false;

  get isCurrentUserHost(): boolean {
    const user = this.authService.getCurrentUser();
    return !!this.room && user != null && this.room.hostId === user.userId;
  }

  get isRoomPlaying(): boolean {
    return this.room?.playing ?? false;
  }

  /** Показать кнопку «Воспроизвести»: комната играет, но у участника плеер на паузе (часто из‑за блокировки автовоспроизведения браузером). */
  get showResumePrompt(): boolean {
    return (
      !this.needJoin &&
      !this.isCurrentUserHost &&
      (this.room?.playing ?? false) &&
      !this.isPlayerPlaying &&
      this.room?.currentTrackId != null
    );
  }

  /** Запуск воспроизведения по клику пользователя (обходит блокировку автовоспроизведения). Сначала запрашиваем позицию у хоста. */
  startPlaybackWithUserGesture(): void {
    if (!this.room) return;
    this.roomRealtimeService.requestPositionFromHost()
      .pipe(
        takeUntil(this.destroy$),
        timeout(5000),
        catchError(() => this.roomService.getById(this.room!.id))
      )
      .subscribe({
        next: (data: HostPositionResponse | RoomResponse) => {
          const isHostResponse = 'requestId' in data;
          if (isHostResponse) {
            const res = data as HostPositionResponse;
            const state: RoomResponse = {
              ...this.room!,
              positionSeconds: res.positionSeconds,
              playing: res.playing,
              currentTrackId: res.currentTrackId,
              currentQueueItemId: res.currentQueueItemId ?? undefined
            };
            this.room = state;
            this.needScrollQueueToCurrent = true;
            this.syncPlayerToRoom(state);
          } else {
            this.room = data as RoomResponse;
            this.needScrollQueueToCurrent = true;
            this.syncPlayerToRoom(this.room);
          }
        },
        error: () => {}
      });
  }

  /** Обложка для фона и карточки: своя обложка комнаты или обложка текущего трека. */
  get effectiveCoverUrl(): string | null {
    const path = this.room?.coverImagePath ?? this.room?.currentTrackCoverPath;
    if (!path) return null;
    return path.startsWith('http') ? path : '/api/covers/' + path;
  }

  get currentTrackCoverUrl(): string | null {
    const path = this.room?.currentTrackCoverPath;
    if (!path) return null;
    return path.startsWith('http') ? path : '/api/covers/' + path;
  }

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.currentUserId = user?.userId ?? null;

    this.playerService.currentTrack$
      .pipe(takeUntil(this.destroy$))
      .subscribe((t: unknown) => {
        this.hasActiveTrack = !!t;
      });
    this.playerService.isPlaying$
      .pipe(takeUntil(this.destroy$))
      .subscribe(playing => {
        this.ngZone.run(() => {
          this.isPlayerPlaying = playing;
        });
      });

    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(paramMap => {
      const id = paramMap.get('id');
      if (id) this.loadRoom(+id);
    });
  }

  ngOnDestroy(): void {
    this.clearPlayRetryTimeout();
    this.stopPositionTicking();
    this.roomControlService.unregister();
    this.roomRealtimeService.disconnect();
    this.destroy$.next();
    this.destroy$.complete();
  }

  private clearPlayRetryTimeout(): void {
    if (this.playRetryTimeoutId != null) {
      clearTimeout(this.playRetryTimeoutId);
      this.playRetryTimeoutId = null;
    }
  }

  private stopPositionTicking(): void {
    if (this.positionTickIntervalId != null) {
      clearInterval(this.positionTickIntervalId);
      this.positionTickIntervalId = null;
    }
  }

  private updatePositionTicking(): void {
    // Отправляет только хост и только когда комната играет.
    const shouldTick = !!this.room && this.isCurrentUserHost && !this.needJoin && (this.room.playing ?? false) && this.room.currentTrackId != null;
    if (!shouldTick) {
      this.stopPositionTicking();
      return;
    }
    if (this.positionTickIntervalId != null) return;

    this.positionTickIntervalId = setInterval(() => {
      if (!this.room || !this.isCurrentUserHost || this.needJoin) return;
      if (!(this.room.playing ?? false) || this.room.currentTrackId == null) return;

      const positionSeconds = this.playerService.getCurrentTime?.() ?? this.room.positionSeconds ?? 0;
      this.roomRealtimeService.sendPositionTick({
        positionSeconds,
        playing: this.room.playing ?? false,
        currentTrackId: this.room.currentTrackId ?? null,
        currentQueueItemId: this.room.currentQueueItemId ?? null
      });
    }, 5000);
  }

  private applyPositionTick(tick: PositionTick): void {
    // Слушатели: подстройка позиции без полного sync (чтобы не перезагружать трек/сбрасывать состояние).
    if (this.needJoin || this.isCurrentUserHost) return;
    if (!this.room) return;
    if (!(this.room.playing ?? false)) return;
    if (!tick.playing) return;
    if (this.room.currentTrackId == null || tick.currentTrackId == null) return;
    if (this.room.currentTrackId !== tick.currentTrackId) return;

    const local = this.playerService.getCurrentTime?.() ?? this.room.positionSeconds ?? 0;
    const remote = tick.positionSeconds ?? 0;
    if (Math.abs(local - remote) >= 2) {
      this.playerService.requestSeek(remote);
      // чтобы UI комнаты (progress/position) не выглядел "зависшим" до следующего state push:
      this.room = { ...this.room, positionSeconds: remote };
    }
  }

  /** Запланировать повторную попытку запуска воспроизведения через 1.5 с (после загрузки страницы поток может быть ещё не готов). */
  private schedulePlayRetryIfNeeded(room: RoomResponse): void {
    this.clearPlayRetryTimeout();
    if (!room.playing || !room.currentTrackId || this.needJoin) return;
    this.playRetryTimeoutId = setTimeout(() => {
      this.playRetryTimeoutId = null;
      if (this.destroy$.closed) return;
      if (!this.room?.playing || this.needJoin) return;
      if (this.playerService.isPlaying()) return;
      const current = this.playerService.getCurrentTrack();
      if (current?.id === this.room.currentTrackId) {
        this.playerService.setPlaying(true);
        this.playerService.playCurrent();
      } else {
        this.syncPlayerToRoom(this.room);
      }
    }, 1500);
  }

  ngAfterViewChecked(): void {
    if (this.needScrollQueueToCurrent && this.queueScrollRef?.nativeElement) {
      const el = this.queueScrollRef.nativeElement.querySelector('[data-current="true"]');
      if (el) {
        el.scrollIntoView({ block: 'start', behavior: 'auto' });
      }
      this.needScrollQueueToCurrent = false;
    }
    if (this.needScrollChatToBottom && this.chatScrollRef?.nativeElement) {
      const el = this.chatScrollRef.nativeElement;
      el.scrollTop = el.scrollHeight;
      this.needScrollChatToBottom = false;
    }
  }

  loadRoom(id: number): void {
    this.isLoading = true;
    this.error = '';
    this.needJoin = false;
    this.room = null;

    console.log('[RoomDetailComponent] loadRoom', id);

    this.roomService.getById(id).pipe(
      takeUntil(this.destroy$),
      catchError((err: { status?: number }) => {
        if (err?.status === 403) {
          this.needJoin = true;
          return this.roomService.getSummary(id);
        }
        this.error = err?.status === 404 ? 'Комната не найдена' : 'Не удалось загрузить комнату';
        this.isLoading = false;
        return of(null);
      })
    ).subscribe((data: RoomResponse | null) => {
      this.isLoading = false;
      if (data) {
        this.room = data;
        this.needScrollQueueToCurrent = true;
        this.updatePositionTicking();
        if (this.needJoin) {
          this.chatMessages = [];
          this.roomControlService.unregister();
        } else {
          console.log('[RoomDetailComponent] joined room, subscribing to realtime for room', data.id);
          this.syncPlayerToRoom(data);
          this.schedulePlayRetryIfNeeded(data);
          this.subscribeToRealtime(data.id);
          this.loadChatHistory(data.id);
          if (this.isCurrentUserHost) {
            this.roomControlService.register({
              previous: () => this.roomPrevious(),
              next: () => this.roomSkip(),
              playPause: () => this.roomPlayPause(),
              seekTo: (positionSeconds: number) => this.roomSeekTo(positionSeconds)
            });
          } else {
            this.roomControlService.unregister();
          }
        }
      }
    });
  }

  private subscribeToRealtime(roomId: number): void {
    // Отменить предыдущие подписки, чтобы при повторном loadRoom не копились дубликаты сообщений и обновлений.
    this.realtimeUnsubscribe$.next();

    const stop$ = merge(this.destroy$, this.realtimeUnsubscribe$);

    this.roomRealtimeService.connect(roomId)
      .pipe(takeUntil(stop$))
      .subscribe((state: RoomResponse) => {
        this.ngZone.run(() => {
          console.log('[RoomDetailComponent] realtime update for room', roomId, state);
          const playbackChanged = this.hasPlaybackStateChanged(this.room, state);
          const roomPlayingButPlayerPaused = state.playing && !this.playerService.isPlaying();
          this.room = state;
          this.needScrollQueueToCurrent = true;
          this.updatePositionTicking();
          if (!this.needJoin && (playbackChanged || roomPlayingButPlayerPaused)) {
            this.syncPlayerToRoom(state);
            if (roomPlayingButPlayerPaused) this.schedulePlayRetryIfNeeded(state);
          }
        });
      });
    this.roomRealtimeService.onChat()
      .pipe(takeUntil(stop$))
      .subscribe((msg: RoomChatMessage) => {
        this.ngZone.run(() => {
          this.chatMessages.push({
            userId: msg.userId,
            username: msg.username,
            isHost: msg.host,
            text: msg.text,
            time: new Date(msg.createdAt)
          });
          this.needScrollChatToBottom = true;
        });
      });
    this.roomRealtimeService.onRoomClosed()
      .pipe(takeUntil(stop$))
      .subscribe(() => {
        this.ngZone.run(() => {
          this.error = 'Комната закрыта';
          this.router.navigate(['/rooms']);
        });
      });
    this.roomRealtimeService.onPositionTick()
      .pipe(takeUntil(stop$))
      .subscribe(tick => {
        this.ngZone.run(() => {
          this.applyPositionTick(tick);
        });
      });
    this.roomRealtimeService.onGetPositionRequest()
      .pipe(takeUntil(stop$))
      .subscribe(req => {
        this.ngZone.run(() => {
          if (!this.isCurrentUserHost || !this.room) return;
          const positionSeconds = this.playerService.getCurrentTime?.() ?? this.room.positionSeconds ?? 0;
          this.roomRealtimeService.sendPositionResponse(req.requestId, {
            positionSeconds,
            playing: this.room.playing ?? false,
            currentTrackId: this.room.currentTrackId ?? null,
            currentQueueItemId: this.room.currentQueueItemId ?? null
          });
        });
      });
  }

  /**
   * Изменилось ли состояние воспроизведения (трек, пауза/play, позиция).
   * Если изменилась только очередь/участники — не трогаем плеер, чтобы не сбрасывать позицию.
   */
  private hasPlaybackStateChanged(prev: RoomResponse | null, next: RoomResponse): boolean {
    if (!prev) return true;
    if (prev.currentTrackId !== next.currentTrackId) return true;
    if ((prev.currentQueueItemId ?? null) !== (next.currentQueueItemId ?? null)) return true;
    if (prev.playing !== next.playing) return true;
    const prevPos = prev.positionSeconds ?? 0;
    const nextPos = next.positionSeconds ?? 0;
    if (Math.abs(prevPos - nextPos) > 0.5) return true;
    return false;
  }

  /** Синхронизировать плеер с состоянием комнаты (текущий трек и воспроизведение). */
  syncPlayerToRoom(room: RoomResponse): void {
    if (!room.currentTrackId) {
      this.playerService.setCurrentTrack(null);
      return;
    }
    const positionSeconds = room.positionSeconds ?? 0;
    const current = this.playerService.getCurrentTrack();
    const sameTrack = current?.id === room.currentTrackId;

    if (!room.playing) {
      this.playerService.setPlaying(false);
      this.playerService.requestPause();
      if (sameTrack) {
        this.playerService.requestSeek(positionSeconds);
        return;
      }
      // Комната на паузе, но трек другой или ещё не загружен — ставим трек и оставляем на паузе
      this.trackService.getById(room.currentTrackId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (track) => {
            this.playerService.setCurrentTrack(track);
            this.playerService.setPendingSeek?.(positionSeconds);
            this.playerService.setPlaying(false);
            this.playerService.requestSeek(positionSeconds);
            this.playerService.requestPause();
          },
          error: () => {}
        });
      return;
    }

    if (sameTrack) {
      this.playerService.setPlaying(true);
      this.playerService.requestSeek(positionSeconds);
      this.playerService.playCurrent();
      return;
    }
    // Комната играет, загружаем трек и запускаем воспроизведение
    this.trackService.getById(room.currentTrackId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (track) => {
          this.playerService.setCurrentTrack(track);
          this.playerService.setPendingSeek?.(positionSeconds);
          this.playerService.setPlaying(true);
          this.playerService.playCurrent();
        },
        error: () => {}
      });
  }

  joinRoom(): void {
    if (!this.room || this.isJoining) return;
    this.isJoining = true;
    this.roomService.join(this.room.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.needJoin = false;
        this.isJoining = false;
        this.loadRoom(this.room!.id);
      },
      error: () => {
        this.isJoining = false;
        this.error = 'Не удалось присоединиться';
      }
    });
  }

  getCoverUrl(path: string | undefined | null): string {
    if (!path) return '';
    return path.startsWith('http') ? path : '/api/covers/' + path;
  }

  /** Стиль фона для блока обложки: своя обложка комнаты или текущего трека. */
  getEffectiveCoverStyle(): string {
    const path = this.room?.coverImagePath ?? this.room?.currentTrackCoverPath;
    if (!path) return 'none';
    return 'url(' + this.getCoverUrl(path) + ')';
  }

  getCurrentTrackTitle(): string {
    return this.room?.currentTrackTitle ?? '—';
  }

  getCurrentTrackArtist(): string {
    return this.room?.currentTrackArtistName ?? '—';
  }

  formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  formatTime(d: Date): string {
    return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  }

  private loadChatHistory(roomId: number): void {
    this.roomService.getChat(roomId, 50)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (messages: RoomChatMessage[]) => {
          this.chatMessages = messages.map(msg => ({
            userId: msg.userId,
            username: msg.username,
            isHost: msg.host,
            text: msg.text,
            time: new Date(msg.createdAt)
          }));
          this.needScrollChatToBottom = true;
        },
        error: () => {
          // ignore chat history errors
        }
      });
  }

  /** Полный список очереди (все треки по порядку). Текущий трек может быть в начале, если его нет в queue. */
  getQueueItems(): (RoomQueueItemInfo & { isCurrent?: boolean })[] {
    const queue = this.room?.queue ?? [];
    const currentId = this.room?.currentTrackId;
    const currentItemId = this.room?.currentQueueItemId ?? undefined;
    if (currentId == null) {
      return queue.map(item => ({ ...item, isCurrent: false }));
    }
    const idx = currentItemId != null
      ? queue.findIndex(item => item.id === currentItemId)
      : queue.findIndex(item => item.trackId === currentId);
    if (idx >= 0) {
      return queue.map((item, i) => ({ ...item, isCurrent: i === idx }));
    }
    const virtualCurrent: RoomQueueItemInfo & { isCurrent?: boolean } = {
      id: 0,
      position: -1,
      trackId: currentId,
      trackTitle: this.room?.currentTrackTitle ?? undefined,
      trackArtistName: this.room?.currentTrackArtistName ?? undefined,
      durationSeconds: undefined,
      trackCoverPath: this.room?.currentTrackCoverPath ?? undefined,
      isCurrent: true
    };
    return [virtualCurrent, ...queue.map(item => ({ ...item, isCurrent: false }))];
  }

  /** Индекс текущего трека в полном списке (-1 если нет текущего). */
  getCurrentQueueIndex(): number {
    const list = this.getQueueItems();
    return list.findIndex(item => item.isCurrent);
  }

  canGoPrevious(): boolean {
    return this.getCurrentQueueIndex() > 0;
  }

  canGoNext(): boolean {
    const list = this.getQueueItems();
    const idx = this.getCurrentQueueIndex();
    return idx >= 0 && idx < list.length - 1;
  }

  roomPlayPause(): void {
    if (!this.room || !this.isCurrentUserHost) return;
    const queue = this.getQueueItems();
    const newPlaying = !this.room.playing;

    if (!this.room.currentTrackId && queue.length > 0) {
      const first = queue[0];
      this.roomService.updateState(this.room.id, {
        queueItemId: first.id !== 0 ? first.id : undefined,
        currentTrackId: first.trackId,
        positionSeconds: 0,
        playing: true
      }).pipe(takeUntil(this.destroy$)).subscribe({
        next: (updated) => {
          this.room = updated;
          this.needScrollQueueToCurrent = true;
          this.syncPlayerToRoom(updated);
        },
        error: () => {}
      });
      return;
    }

    if (this.room.currentTrackId) {
      const currentPosition = this.playerService.getCurrentTime
        ? this.playerService.getCurrentTime()
        : (this.room.positionSeconds ?? 0);
      this.roomService.updateState(this.room.id, {
        queueItemId: this.room.currentQueueItemId ?? undefined,
        currentTrackId: this.room.currentTrackId,
        positionSeconds: currentPosition,
        playing: newPlaying
      }).pipe(takeUntil(this.destroy$)).subscribe({
        next: (updated) => {
          this.room = updated;
          this.needScrollQueueToCurrent = true;
          if (newPlaying) {
            this.syncPlayerToRoom(updated);
          } else {
            this.playerService.requestPause();
          }
        },
        error: () => {}
      });
    } else {
      this.roomService.updateState(this.room.id, { playing: false }).pipe(takeUntil(this.destroy$)).subscribe({
        next: (updated) => {
          this.room = updated;
          this.needScrollQueueToCurrent = true;
          this.playerService.setCurrentTrack(null);
        },
        error: () => {}
      });
    }
  }

  roomPrevious(): void {
    if (!this.room || !this.isCurrentUserHost || !this.canGoPrevious()) return;
    const queue = this.getQueueItems();
    const prev = queue[this.getCurrentQueueIndex() - 1];
    this.roomService.updateState(this.room.id, {
      queueItemId: prev.id !== 0 ? prev.id : undefined,
      currentTrackId: prev.trackId,
      positionSeconds: 0,
      playing: true
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (updated) => {
        this.room = updated;
        this.needScrollQueueToCurrent = true;
        this.syncPlayerToRoom(updated);
      },
      error: () => {}
    });
  }

  roomSkip(): void {
    if (!this.room || !this.isCurrentUserHost) return;
    const queue = this.getQueueItems();
    const idx = this.getCurrentQueueIndex();

    if (idx >= 0 && idx < queue.length - 1) {
      const next = queue[idx + 1];
      this.roomService.updateState(this.room.id, {
        queueItemId: next.id !== 0 ? next.id : undefined,
        currentTrackId: next.trackId,
        positionSeconds: 0,
        playing: true
      }).pipe(takeUntil(this.destroy$)).subscribe({
        next: (updated) => {
          this.room = updated;
          this.needScrollQueueToCurrent = true;
          this.syncPlayerToRoom(updated);
        },
        error: () => {}
      });
    } else if (idx >= 0 && idx === queue.length - 1) {
      this.roomService.updateState(this.room.id, {
        currentTrackId: null,
        positionSeconds: 0,
        playing: false
      }).pipe(takeUntil(this.destroy$)).subscribe({
        next: (updated) => {
          this.room = updated;
          this.needScrollQueueToCurrent = true;
          this.playerService.setCurrentTrack(null);
        },
        error: () => {}
      });
    } else {
      this.roomService.updateState(this.room.id, {
        currentTrackId: null,
        positionSeconds: 0,
        playing: false
      }).pipe(takeUntil(this.destroy$)).subscribe({
        next: (updated) => {
          this.room = updated;
          this.needScrollQueueToCurrent = true;
          this.playerService.setCurrentTrack(null);
        },
        error: () => {}
      });
    }
  }

  /** Перемотка в комнате: устанавливает positionSeconds и playing=true для текущего трека. */
  roomSeekTo(positionSeconds: number): void {
    if (!this.room || !this.isCurrentUserHost || !this.room.currentTrackId) return;
    this.roomService.updateState(this.room.id, {
      queueItemId: this.room.currentQueueItemId ?? undefined,
      currentTrackId: this.room.currentTrackId,
      positionSeconds,
      // сохраняем текущее состояние play/pause комнаты:
      // если была пауза — остаётся пауза, если играло — продолжаем играть.
      playing: this.room.playing
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (updated) => {
        this.room = updated;
        this.needScrollQueueToCurrent = true;
        this.syncPlayerToRoom(updated);
      },
      error: () => {}
    });
  }

  leaveRoom(): void {
    if (!this.room) return;
    this.roomService.leave(this.room.id).subscribe({
      next: () => this.router.navigate(['/rooms'])
    });
  }

  openSettings(): void {
    this.showSettingsOverlay = true;
  }

  closeSettingsOverlay(): void {
    this.showSettingsOverlay = false;
  }

  onSettingsSaved(payload: { name: string; maxMembers: number | null }): void {
    if (!this.room) return;
    this.roomService.update(this.room.id, { name: payload.name, maxMembers: payload.maxMembers })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updated) => {
          this.room = updated;
          this.needScrollQueueToCurrent = true;
          this.showSettingsOverlay = false;
        },
        error: () => {}
      });
  }

  onCoverUpdated(updated: RoomResponse): void {
    this.room = updated;
    this.needScrollQueueToCurrent = true;
  }

  invite(): void {
    // TODO: copy link or modal
  }

  sendMessage(): void {
    const text = this.chatInput.trim();
    if (!text) return;
    if (!this.room) return;
    this.roomService.postChatMessage(this.room.id, text)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.chatInput = '';
        },
        error: () => {
          // ignore for now
        }
      });
  }

  /** Клик по строке очереди: хост может включить трек или переключиться на другой. */
  onQueueItemClick(item: RoomQueueItemInfo & { isCurrent?: boolean }, event: MouseEvent): void {
    if (!this.room || !this.isCurrentUserHost) return;
    if ((event.target as HTMLElement).closest('button')) return;
    if (item.isCurrent) {
      this.roomPlayPause();
      return;
    }
    this.roomService.updateState(this.room.id, {
      queueItemId: item.id !== 0 ? item.id : undefined,
      currentTrackId: item.trackId,
      positionSeconds: 0,
      playing: true
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (updated) => {
        this.room = updated;
        this.needScrollQueueToCurrent = true;
        this.syncPlayerToRoom(updated);
      },
      error: () => {}
    });
  }

  /** Удаление из очереди: обновление списка придёт по WebSocket, loadRoom не вызываем, чтобы не сбрасывать позицию плеера. */
  removeFromQueue(item: RoomQueueItemInfo): void {
    if (!this.room) return;
    this.roomService.removeFromQueue(this.room.id, item.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {},
      error: () => {}
    });
  }

  openAddToQueueOverlay(): void {
    this.showAddToQueueOverlay = true;
    this.addToQueueSearchQuery = '';
    this.addToQueueTracks = [];
    this.addToQueueLoading = false;
    this.addToQueueFavoriteTracks = [];
    this.addToQueueFavoritesLoading = true;
    this.favoritesService.getTracks()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tracks) => {
          this.addToQueueFavoriteTracks = tracks;
          this.addToQueueFavoritesLoading = false;
        },
        error: () => {
          this.addToQueueFavoritesLoading = false;
        }
      });
  }

  closeAddToQueueOverlay(): void {
    this.showAddToQueueOverlay = false;
  }

  /** Треки для отображения: при пустом поле — избранное, иначе — результаты поиска. */
  get addToQueueDisplayTracks(): TrackResponse[] {
    return this.addToQueueSearchQuery.trim() ? this.addToQueueTracks : this.addToQueueFavoriteTracks;
  }

  get addToQueueDisplayLoading(): boolean {
    return this.addToQueueSearchQuery.trim() ? this.addToQueueLoading : this.addToQueueFavoritesLoading;
  }

  searchTracksForQueue(): void {
    const query = this.addToQueueSearchQuery.trim();
    if (!query) {
      this.addToQueueTracks = [];
      return;
    }
    this.addToQueueLoading = true;
    this.trackService.getPage(0, 20, query)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (page) => {
          this.addToQueueTracks = page.content;
          this.addToQueueLoading = false;
        },
        error: () => {
          this.addToQueueLoading = false;
        }
      });
  }

  addTrackToQueue(track: TrackResponse): void {
    if (!this.room) return;
    this.addToQueueAddingId = track.id;
    this.roomService.addToQueue(this.room.id, track.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.addToQueueAddingId = null;
        // Очередь обновится по WebSocket, loadRoom не вызываем.
      },
      error: () => {
        this.addToQueueAddingId = null;
      }
    });
  }
}
