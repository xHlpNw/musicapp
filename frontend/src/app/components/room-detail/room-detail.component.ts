import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { SideNavComponent } from '../side-nav/side-nav.component';
import { AppHeaderComponent } from '../app-header/app-header.component';
import { AuthService } from '../../services/auth.service';
import { PlayerService } from '../../services/player.service';
import { RoomService } from '../../services/room.service';
import { RoomResponse, RoomQueueItemInfo } from '../../models/room.model';
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
export class RoomDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private playerService = inject(PlayerService);
  private roomService = inject(RoomService);
  private destroy$ = new Subject<void>();

  room: RoomResponse | null = null;
  /** Показать кнопку «Присоединиться» (пользователь не участник). */
  needJoin = false;
  showSettingsOverlay = false;
  chatMessages: ChatMessageData[] = [];
  chatInput = '';
  isLoading = true;
  isJoining = false;
  error = '';
  hasActiveTrack = false;

  get isCurrentUserHost(): boolean {
    const user = this.authService.getCurrentUser();
    return !!this.room && user != null && this.room.hostId === user.userId;
  }

  get isRoomPlaying(): boolean {
    return this.room?.playing ?? false;
  }

  get currentTrackCoverUrl(): string | null {
    const path = this.room?.currentTrackCoverPath;
    if (!path) return null;
    return path.startsWith('http') ? path : '/api/covers/' + path;
  }

  ngOnInit(): void {
    this.playerService.currentTrack$.pipe(takeUntil(this.destroy$)).subscribe(t => {
      this.hasActiveTrack = !!t;
    });

    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(paramMap => {
      const id = paramMap.get('id');
      if (id) this.loadRoom(+id);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadRoom(id: number): void {
    this.isLoading = true;
    this.error = '';
    this.needJoin = false;
    this.room = null;

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
        if (this.needJoin) {
          this.chatMessages = [];
        }
      }
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

  getQueueItems(): RoomQueueItemInfo[] {
    return this.room?.queue ?? [];
  }

  roomPlayPause(): void {
    // TODO: PUT /api/rooms/:id/state
  }

  roomSkip(): void {
    // TODO: next track
  }

  roomShuffle(): void {
    // TODO: shuffle queue
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
          this.showSettingsOverlay = false;
        },
        error: () => {}
      });
  }

  invite(): void {
    // TODO: copy link or modal
  }

  sendMessage(): void {
    const text = this.chatInput.trim();
    if (!text) return;
    const user = this.authService.getCurrentUser();
    this.chatMessages.push({
      userId: user?.userId ?? 0,
      username: user?.username ?? 'Гость',
      isHost: this.isCurrentUserHost,
      text,
      time: new Date()
    });
    this.chatInput = '';
  }

  removeFromQueue(item: RoomQueueItemInfo): void {
    // TODO: DELETE /api/rooms/:id/queue/:queueItemId
  }
}
