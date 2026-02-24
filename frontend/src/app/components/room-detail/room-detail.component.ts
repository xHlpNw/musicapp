import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SideNavComponent } from '../side-nav/side-nav.component';
import { AppHeaderComponent } from '../app-header/app-header.component';
import { AuthService } from '../../services/auth.service';
import { PlayerService } from '../../services/player.service';
import { TrackResponse } from '../../models/track.model';

export interface RoomDetailData {
  id: number;
  name: string;
  hostId: number;
  hostUsername: string;
  memberCount: number;
  maxMembers: number | null;
  isOpen: boolean;
  currentTrack: TrackResponse | null;
  positionSeconds: number;
  playing: boolean;
  queue: QueueItemData[];
  isCurrentUserHost: boolean;
}

export interface QueueItemData {
  id: number;
  position: number;
  track: TrackResponse;
  addedByUsername: string;
}

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
  imports: [CommonModule, FormsModule, RouterLink, SideNavComponent, AppHeaderComponent],
  templateUrl: './room-detail.component.html',
  styleUrls: ['./room-detail.component.css']
})
export class RoomDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private playerService = inject(PlayerService);
  private destroy$ = new Subject<void>();

  room: RoomDetailData | null = null;
  chatMessages: ChatMessageData[] = [];
  chatInput = '';
  isLoading = true;
  error = '';
  hasActiveTrack = false;

  /** Для атмосферной подсветки: играет ли трек в комнате (влияет на opacity glow). */
  get isRoomPlaying(): boolean {
    return this.room?.playing ?? false;
  }

  /** URL обложки текущего трека для glow (или null). */
  get currentTrackCoverUrl(): string | null {
    const track = this.room?.currentTrack;
    if (!track?.coverImagePath) return null;
    return track.coverImagePath.startsWith('http')
      ? track.coverImagePath
      : '/api/covers/' + track.coverImagePath;
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

  private loadRoom(id: number): void {
    this.isLoading = true;
    this.error = '';
    // Mock: когда будет API — вызывать roomService.getById(id)
    const currentUserId = this.authService.getCurrentUser()?.userId ?? 1;
    this.room = this.getMockRoom(id, currentUserId);
    this.chatMessages = this.getMockChat();
    this.isLoading = false;
  }

  private getMockRoom(id: number, currentUserId: number): RoomDetailData {
    const hostId = 1;
    const isHost = currentUserId === hostId;
    return {
      id,
      name: 'Вечерний чилл',
      hostId,
      hostUsername: 'Алексей',
      memberCount: 5,
      maxMembers: 20,
      isOpen: true,
      positionSeconds: 42,
      playing: true,
      currentTrack: {
        id: 2,
        title: 'Больно',
        durationSeconds: 180,
        artistName: 'Слава КПСС',
        artists: [{ artistId: 1, artistName: 'Слава КПСС' }],
        coverImagePath: 'albums/chudovishe.jpeg'
      },
      queue: [
        {
          id: 1,
          position: 0,
          addedByUsername: 'Мария',
          track: {
            id: 3,
            title: 'Чучело',
            durationSeconds: 206,
            artistName: 'Слава КПСС',
            coverImagePath: 'albums/chudovishe.jpeg'
          }
        },
        {
          id: 2,
          position: 1,
          addedByUsername: 'Алексей',
          track: {
            id: 5,
            title: 'Пески времени',
            durationSeconds: 142,
            artistName: 'Песни',
            coverImagePath: 'albums/peski.jpeg'
          }
        }
      ],
      isCurrentUserHost: isHost
    };
  }

  private getMockChat(): ChatMessageData[] {
    return [
      { userId: 1, username: 'Алексей', isHost: true, text: 'Добро пожаловать в комнату!', time: new Date(Date.now() - 3600000) },
      { userId: 2, username: 'Мария', isHost: false, text: 'Отличный трек', time: new Date(Date.now() - 1800000) },
      { userId: 1, username: 'Алексей', isHost: true, text: 'Спасибо, добавляй в очередь что хочешь', time: new Date(Date.now() - 900000) }
    ];
  }

  getCoverUrl(path: string | undefined): string {
    if (!path) return '';
    return path.startsWith('http') ? path : '/api/covers/' + path;
  }

  getTrackArtistNames(track: TrackResponse): string {
    if (track.artists?.length) return track.artists.map(a => a.artistName).join(', ');
    if (track.artistName) return track.artistName;
    return '—';
  }

  formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  formatTime(d: Date): string {
    return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  }

  roomPlayPause(): void {
    if (!this.room) return;
    this.room.playing = !this.room.playing;
  }

  roomSkip(): void {
    // Mock: переключить на следующий в очереди
  }

  roomShuffle(): void {
    // Mock: перемешать очередь
  }

  leaveRoom(): void {
    this.router.navigate(['/rooms']);
  }

  invite(): void {
    // Mock: копировать ссылку или открыть модалку приглашения
  }

  sendMessage(): void {
    const text = this.chatInput.trim();
    if (!text || !this.room) return;
    const user = this.authService.getCurrentUser();
    this.chatMessages.push({
      userId: user?.userId ?? 0,
      username: user?.username ?? 'Гость',
      isHost: this.room.isCurrentUserHost,
      text,
      time: new Date()
    });
    this.chatInput = '';
  }

  removeFromQueue(item: QueueItemData): void {
    if (!this.room?.isCurrentUserHost) return;
    this.room.queue = this.room.queue.filter(q => q.id !== item.id);
  }
}
