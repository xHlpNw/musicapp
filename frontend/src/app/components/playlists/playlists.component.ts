import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PlaylistService } from '../../services/playlist.service';
import { FavoritesService } from '../../services/favorites.service';
import { AuthService } from '../../services/auth.service';
import { LoginOverlayService } from '../../services/login-overlay.service';
import { PlayerService } from '../../services/player.service';
import { PlaylistResponse } from '../../models/playlist.model';
import { LoginResponse } from '../../models/auth.model';
import { SideNavComponent } from '../side-nav/side-nav.component';
import { AppHeaderComponent } from '../app-header/app-header.component';

export type MyPlaylistsFilter = 'all' | 'created' | 'saved';

@Component({
  selector: 'app-playlists',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, SideNavComponent, AppHeaderComponent],
  templateUrl: './playlists.component.html',
  styleUrls: ['./playlists.component.css']
})
export class PlaylistsComponent implements OnInit {
  searchQuery = '';
  myPlaylistsFilter: MyPlaylistsFilter = 'all';

  createdPlaylists: PlaylistResponse[] = [];
  savedPlaylists: PlaylistResponse[] = [];
  /** Популярные плейлисты: первые 8 из каталога (не привязаны к пользователю). */
  popularPlaylists: PlaylistResponse[] = [];
  isLoadingCreated = false;
  isLoadingSaved = false;
  isLoadingPopular = false;
  errorCreated = '';
  errorSaved = '';
  errorPopular = '';

  showCreateModal = false;
  createName = '';
  createDescription = '';
  createError = '';
  isCreating = false;

  hasActiveTrack = false;
  currentUserId: number | null = null;
  private searchDebounce: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private playlistService: PlaylistService,
    private favoritesService: FavoritesService,
    public authService: AuthService,
    public playerService: PlayerService,
    private loginOverlay: LoginOverlayService
  ) {}

  openLogin(event: Event): void {
    event.preventDefault();
    this.loginOverlay.open();
  }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(u => {
      this.currentUserId = u?.userId ?? null;
    });
    this.loadCreated();
    this.loadSaved();
    this.loadPopularPlaylists();
    this.playerService.currentTrack$.subscribe(t => this.hasActiveTrack = !!t);
  }

  loadPopularPlaylists(): void {
    this.isLoadingPopular = true;
    this.errorPopular = '';
    const q = this.searchQuery.trim() || undefined;
    const size = q ? 50 : 8;
    this.playlistService.getBrowsePlaylists(0, size, q).subscribe({
      next: (res) => {
        this.popularPlaylists = res.content;
        this.isLoadingPopular = false;
      },
      error: () => {
        this.errorPopular = 'Не удалось загрузить плейлисты';
        this.isLoadingPopular = false;
      }
    });
  }

  loadCreated(): void {
    this.isLoadingCreated = true;
    this.errorCreated = '';
    this.playlistService.getMyPlaylists(undefined, 0, 100).subscribe({
      next: (res) => {
        this.createdPlaylists = res.content;
        this.isLoadingCreated = false;
      },
      error: () => {
        this.errorCreated = 'Не удалось загрузить плейлисты';
        this.isLoadingCreated = false;
      }
    });
  }

  loadSaved(): void {
    this.isLoadingSaved = true;
    this.errorSaved = '';
    this.favoritesService.getPlaylists().subscribe({
      next: (list) => {
        this.savedPlaylists = list;
        this.isLoadingSaved = false;
      },
      error: () => {
        this.errorSaved = 'Не удалось загрузить сохранённые плейлисты';
        this.isLoadingSaved = false;
      }
    });
  }

  onSearchChange(): void {
    if (this.searchDebounce) clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => {
      this.searchDebounce = null;
      this.loadPopularPlaylists();
    }, 300);
  }

  get filteredMyPlaylists(): PlaylistResponse[] {
    if (this.myPlaylistsFilter === 'created') {
      return this.createdPlaylists;
    }
    if (this.myPlaylistsFilter === 'saved') {
      return this.savedPlaylists;
    }
    const createdIds = new Set(this.createdPlaylists.map(p => p.id));
    const saved = this.savedPlaylists.filter(p => !createdIds.has(p.id));
    return [...this.createdPlaylists, ...saved];
  }

  isOwnPlaylist(playlist: PlaylistResponse): boolean {
    return this.currentUserId != null && playlist.ownerId === this.currentUserId;
  }

  trackCountLabel(count: number): string {
    if (count === 1) return '1 трек';
    if (count >= 2 && count <= 4) return `${count} трека`;
    return `${count} треков`;
  }

  openCreateModal(): void {
    this.showCreateModal = true;
    this.createName = '';
    this.createDescription = '';
    this.createError = '';
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
    this.createError = '';
  }

  onCreateSubmit(): void {
    this.createError = '';
    const name = this.createName.trim();
    if (!name) {
      this.createError = 'Введите название плейлиста';
      return;
    }
    this.isCreating = true;
    this.playlistService.create({ name, description: this.createDescription.trim() || undefined }).subscribe({
      next: () => {
        this.isCreating = false;
        this.closeCreateModal();
        this.loadCreated();
      },
      error: () => {
        this.createError = 'Не удалось создать плейлист';
        this.isCreating = false;
      }
    });
  }

  getAvatarUrl(user: LoginResponse): string | null {
    if (!user?.avatarUrl) return null;
    const base = user.avatarUrl.startsWith('http') ? user.avatarUrl : '/api/covers/' + user.avatarUrl;
    const sep = base.includes('?') ? '&' : '?';
    return user.avatarVersion ? `${base}${sep}v=${user.avatarVersion}` : base;
  }

  getInitial(user: LoginResponse): string {
    return user?.username?.charAt(0)?.toUpperCase() ?? '?';
  }
}
