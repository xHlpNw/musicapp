import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import { ListenHistoryService } from '../../services/listen-history.service';
import { PlayerService } from '../../services/player.service';
import { ListenHistoryItem } from '../../models/listen-history.model';
import { TrackResponse } from '../../models/track.model';
import { SideNavComponent } from '../side-nav/side-nav.component';
import { AppHeaderComponent } from '../app-header/app-header.component';
import { TrackActionsComponent } from '../track-actions/track-actions.component';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, SideNavComponent, AppHeaderComponent, TrackActionsComponent],
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.css']
})
export class HistoryComponent implements OnInit {
  items: ListenHistoryItem[] = [];
  totalElements = 0;
  totalPages = 0;
  currentPage = 0;
  isLoading = false;
  error = '';
  hasActiveTrack = false;
  searchQuery = '';

  constructor(
    private listenHistoryService: ListenHistoryService,
    public playerService: PlayerService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.loadPage();
    this.playerService.currentTrack$.subscribe(t => {
      this.hasActiveTrack = !!t;
    });
  }

  loadPage(): void {
    this.isLoading = true;
    this.error = '';
    this.listenHistoryService.getHistory(this.currentPage, PAGE_SIZE).subscribe({
      next: (res) => {
        this.items = res.content;
        this.totalElements = res.totalElements;
        this.totalPages = res.totalPages;
        this.isLoading = false;
      },
      error: () => {
        this.error = 'Не удалось загрузить историю';
        this.isLoading = false;
      }
    });
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.loadPage();
    }
  }

  prevPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadPage();
    }
  }

  playTrack(track: TrackResponse): void {
    this.playerService.setCurrentTrack(track);
  }

  isCurrentTrack(track: TrackResponse): boolean {
    return this.playerService.getCurrentTrack()?.id === track.id;
  }

  isTrackPlaying(track: TrackResponse): boolean {
    const current = this.playerService.getCurrentTrack();
    return current?.id === track.id && this.playerService.isPlaying();
  }

  formatPlayedAt(playedAt: string): string {
    if (!playedAt) return '—';
    const d = new Date(playedAt);
    return d.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  getCoversUrl(path: string | undefined): string | null {
    if (!path) return null;
    return '/api/covers/' + path;
  }

  getTrackCoverClass(index: number): string {
    return 'cover--' + ((index % 6) + 1);
  }

  getTrackCoverStyle(track: TrackResponse): SafeStyle | null {
    const url = this.getCoversUrl(track.coverImagePath);
    return url ? this.sanitizer.bypassSecurityTrustStyle('url(' + url + ')') : null;
  }

  getTrackArtistNames(track: TrackResponse): string {
    if (track.artists?.length) return track.artists.map(a => a.artistName).join(', ');
    if (track.artistName) return track.artistName;
    return '—';
  }
}
