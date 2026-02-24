import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SideNavComponent } from '../side-nav/side-nav.component';
import { AppHeaderComponent } from '../app-header/app-header.component';
import { CreateRoomOverlayComponent, CreateRoomPayload } from '../create-room-overlay/create-room-overlay.component';
import { PlayerService } from '../../services/player.service';
import { RoomService } from '../../services/room.service';
import { RoomResponse, RoomPageResponse } from '../../models/room.model';

export type RoomFilter = 'all' | 'open' | 'mine';

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

  popularRooms: RoomResponse[] = [];
  roomsPage: RoomPageResponse | null = null;
  currentPage = 0;
  readonly pageSize = 24;
  isLoadingPopular = false;
  isLoadingRooms = false;
  errorPopular = '';
  errorRooms = '';

  constructor(
    private playerService: PlayerService,
    private roomService: RoomService,
    private router: Router
  ) {}

  get filteredRooms(): RoomResponse[] {
    return this.roomsPage?.content ?? [];
  }

  get totalPages(): number {
    return this.roomsPage?.totalPages ?? 0;
  }

  get isFirstPage(): boolean {
    return this.roomsPage?.first ?? true;
  }

  get isLastPage(): boolean {
    return this.roomsPage?.last ?? true;
  }

  ngOnInit(): void {
    this.playerService.currentTrack$.pipe(takeUntil(this.destroy$)).subscribe(track => {
      this.hasActiveTrack = !!track;
    });
    this.loadPopular();
    this.loadRooms();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadPopular(): void {
    this.isLoadingPopular = true;
    this.errorPopular = '';
    this.roomService.getPopular(10).pipe(takeUntil(this.destroy$)).subscribe({
      next: (list) => {
        this.popularRooms = list;
        this.isLoadingPopular = false;
      },
      error: () => {
        this.errorPopular = 'Не удалось загрузить популярные комнаты';
        this.isLoadingPopular = false;
      }
    });
  }

  loadRooms(): void {
    this.isLoadingRooms = true;
    this.errorRooms = '';
    this.roomService.getRooms(this.roomFilter, this.searchQuery.trim() || undefined, this.currentPage, this.pageSize)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (page) => {
          this.roomsPage = page;
          this.isLoadingRooms = false;
        },
        error: () => {
          this.errorRooms = 'Не удалось загрузить список комнат';
          this.isLoadingRooms = false;
        }
      });
  }

  onFilterChange(): void {
    this.currentPage = 0;
    this.loadRooms();
  }

  onSearchChange(): void {
    this.currentPage = 0;
    this.loadRooms();
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.loadRooms();
  }

  createRoom(): void {
    this.showCreateRoomOverlay = true;
  }

  onCloseCreateRoomOverlay(): void {
    this.showCreateRoomOverlay = false;
  }

  onRoomCreated(payload: CreateRoomPayload): void {
    this.showCreateRoomOverlay = false;
    this.roomService.create({
      name: payload.name,
      maxMembers: payload.isPrivate ? 10 : undefined
    }).subscribe({
      next: (room) => {
        this.loadPopular();
        this.loadRooms();
        this.router.navigate(['/rooms', room.id]);
      },
      error: () => {
        // ошибка показывается глобально или можно добавить toast
      }
    });
  }

  getCoverUrl(room: RoomResponse): string | null {
    const path = room.currentTrackCoverPath;
    if (!path) return null;
    return path.startsWith('http') ? path : '/api/covers/' + path;
  }

  isRoomOpen(room: RoomResponse): boolean {
    return room.maxMembers == null || room.memberCount < room.maxMembers;
  }
}
