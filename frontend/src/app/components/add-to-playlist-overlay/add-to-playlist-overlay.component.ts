import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AddToPlaylistOverlayService } from '../../services/add-to-playlist-overlay.service';
import { PlaylistService } from '../../services/playlist.service';
import { PlaylistResponse } from '../../models/playlist.model';
import { AuthService } from '../../services/auth.service';
import { LoginOverlayService } from '../../services/login-overlay.service';
import { TrackResponse } from '../../models/track.model';

@Component({
  selector: 'app-add-to-playlist-overlay',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './add-to-playlist-overlay.component.html',
  styleUrls: ['./add-to-playlist-overlay.component.css']
})
export class AddToPlaylistOverlayComponent implements OnInit, OnDestroy {
  isOpen = false;
  track: TrackResponse | null = null;

  playlists: PlaylistResponse[] = [];
  playlistsLoading = false;
  addLoadingId: number | null = null;
  error = '';
  success = '';

  private destroy$ = new Subject<void>();

  constructor(
    private overlay: AddToPlaylistOverlayService,
    private playlistService: PlaylistService,
    private authService: AuthService,
    private loginOverlay: LoginOverlayService
  ) {}

  ngOnInit(): void {
    this.overlay.state$.pipe(takeUntil(this.destroy$)).subscribe(state => {
      this.isOpen = state.isOpen;
      this.track = state.track;
      this.error = '';
      this.success = '';
      this.addLoadingId = null;

      if (this.isOpen) {
        if (!this.authService.isAuthenticated()) {
          // Закрываем, чтобы не висел пустой оверлей, и открываем логин
          this.overlay.close();
          this.loginOverlay.open();
          return;
        }
        this.loadPlaylists();
      } else {
        this.playlists = [];
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  close(): void {
    this.overlay.close();
  }

  private loadPlaylists(): void {
    this.playlistsLoading = true;
    this.playlists = [];
    this.playlistService.getMyPlaylists(undefined, 0, 200).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.playlists = res.content ?? [];
        this.playlistsLoading = false;
      },
      error: () => {
        this.playlistsLoading = false;
        this.error = 'Не удалось загрузить плейлисты';
      }
    });
  }

  addToPlaylist(pl: PlaylistResponse): void {
    if (!this.track) return;
    this.error = '';
    this.success = '';
    this.addLoadingId = pl.id;
    this.playlistService.addTrack(pl.id, this.track.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.addLoadingId = null;
        this.success = `Добавлено в «${pl.name}»`;
      },
      error: () => {
        this.addLoadingId = null;
        this.error = 'Не удалось добавить трек в плейлист';
      }
    });
  }
}

