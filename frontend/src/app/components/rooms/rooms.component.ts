import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SideNavComponent } from '../side-nav/side-nav.component';
import { AppHeaderComponent } from '../app-header/app-header.component';
import { CreateRoomOverlayComponent, CreateRoomPayload } from '../create-room-overlay/create-room-overlay.component';
import { PlayerService } from '../../services/player.service';

export type RoomFilter = 'all' | 'open' | 'mine';

export interface RoomSummary {
  id: string;
  name: string;
  hostName: string;
  hostId: number;
  participantCount: number;
  currentTrackTitle: string;
  currentTrackCoverUrl: string | null;
  isOpen: boolean;
  isMine: boolean;
}

@Component({
  selector: 'app-rooms',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SideNavComponent, AppHeaderComponent, CreateRoomOverlayComponent],
  templateUrl: './rooms.component.html',
  styleUrls: ['./rooms.component.css']
})
export class RoomsComponent implements OnInit, OnDestroy {
  searchQuery = '';
  roomFilter: RoomFilter = 'all';
  hasActiveTrack = false;
  showCreateRoomOverlay = false;
  private destroy$ = new Subject<void>();

  /** Mock: популярные комнаты (горизонтальный скролл) */
  popularRooms: RoomSummary[] = [
    {
      id: '1',
      name: 'Вечерний чилл',
      hostName: 'Алексей',
      hostId: 1,
      participantCount: 12,
      currentTrackTitle: 'KPSS — Больно',
      currentTrackCoverUrl: '/api/covers/albums/chudovishe.jpeg',
      isOpen: true,
      isMine: false
    },
    {
      id: '2',
      name: 'Русский рок',
      hostName: 'Мария',
      hostId: 2,
      participantCount: 8,
      currentTrackTitle: 'Кино — Группа крови',
      currentTrackCoverUrl: null,
      isOpen: true,
      isMine: false
    },
    {
      id: '3',
      name: 'Фон для работы',
      hostName: 'Дмитрий',
      hostId: 3,
      participantCount: 24,
      currentTrackTitle: 'Twenty One Pilots — Stressed Out',
      currentTrackCoverUrl: '/api/covers/albums/blade.jpeg',
      isOpen: true,
      isMine: false
    },
    {
      id: '4',
      name: 'Инди и альтернатива',
      hostName: 'Ольга',
      hostId: 4,
      participantCount: 5,
      currentTrackTitle: 'Песни — Время',
      currentTrackCoverUrl: '/api/covers/albums/peski.jpeg',
      isOpen: true,
      isMine: false
    }
  ];

  /** Mock: все комнаты (сетка) */
  allRooms: RoomSummary[] = [
    ...this.popularRooms,
    {
      id: '5',
      name: 'Только для друзей',
      hostName: 'Алексей',
      hostId: 1,
      participantCount: 3,
      currentTrackTitle: 'KPSS — Ни надежды, ни страха',
      currentTrackCoverUrl: null,
      isOpen: false,
      isMine: true
    },
    {
      id: '6',
      name: 'Джаз и блюз',
      hostName: 'Иван',
      hostId: 5,
      participantCount: 6,
      currentTrackTitle: '—',
      currentTrackCoverUrl: null,
      isOpen: true,
      isMine: false
    }
  ];

  constructor(private playerService: PlayerService) {}

  ngOnInit(): void {
    this.playerService.currentTrack$.pipe(takeUntil(this.destroy$)).subscribe(track => {
      this.hasActiveTrack = !!track;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get filteredRooms(): RoomSummary[] {
    let list = this.allRooms;
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.trim().toLowerCase();
      list = list.filter(
        r =>
          r.name.toLowerCase().includes(q) ||
          r.hostName.toLowerCase().includes(q) ||
          r.currentTrackTitle.toLowerCase().includes(q)
      );
    }
    if (this.roomFilter === 'open') {
      list = list.filter(r => r.isOpen);
    } else if (this.roomFilter === 'mine') {
      list = list.filter(r => r.isMine);
    }
    return list;
  }

  createRoom(): void {
    this.showCreateRoomOverlay = true;
  }

  onCloseCreateRoomOverlay(): void {
    this.showCreateRoomOverlay = false;
  }

  onRoomCreated(payload: CreateRoomPayload): void {
    this.showCreateRoomOverlay = false;
    // TODO: вызов API создания комнаты, затем переход в комнату или обновление списка
  }

  joinRoom(room: RoomSummary): void {
    // Заглушка: переход в комнату
  }

  getCoverStyle(url: string | null): Record<string, string> {
    if (!url) return {};
    return { backgroundImage: `url(${url})` };
  }
}
