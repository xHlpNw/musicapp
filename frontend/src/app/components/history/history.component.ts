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

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.loadPage();
    }
  }

  /** Элементы пагинации: страница (номер) или многоточие. */
  getPaginationPages(): ({ kind: 'page'; num: number } | { kind: 'ellipsis' })[] {
    const total = this.totalPages;
    const current = this.currentPage;
    const result: ({ kind: 'page'; num: number } | { kind: 'ellipsis' })[] = [];
    if (total <= 7) {
      for (let i = 0; i < total; i++) result.push({ kind: 'page', num: i });
      return result;
    }
    const show = (p: number) => { if (p >= 0 && p < total) result.push({ kind: 'page', num: p }); };
    show(0);
    if (current > 2) result.push({ kind: 'ellipsis' });
    for (let p = Math.max(1, current - 1); p <= Math.min(total - 2, current + 1); p++) show(p);
    if (current < total - 3) result.push({ kind: 'ellipsis' });
    if (total > 1) show(total - 1);
    return result;
  }

  /** Диапазон записей на текущей странице (например "1–20"). */
  getPageRange(): string {
    const from = this.currentPage * PAGE_SIZE + 1;
    const to = Math.min((this.currentPage + 1) * PAGE_SIZE, this.totalElements);
    return `${from}–${to}`;
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

  /** Группы записей по дате (для текущей страницы). */
  getItemsByDateGroups(): { dateLabel: string; dateKey: string; items: ListenHistoryItem[] }[] {
    const map = new Map<string, ListenHistoryItem[]>();
    for (const item of this.items) {
      if (!item.playedAt) continue;
      const d = new Date(item.playedAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    const sortedKeys = Array.from(map.keys()).sort((a, b) => b.localeCompare(a));
    return sortedKeys.map(key => {
      const groupItems = map.get(key)!;
      const d = new Date(groupItems[0].playedAt);
      const dateLabel = d.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      return { dateLabel, dateKey: key, items: groupItems };
    });
  }

  /** Только время (слева от трека). */
  formatTimeOnly(playedAt: string): string {
    if (!playedAt) return '—';
    const d = new Date(playedAt);
    return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  }

  formatPlayedAt(playedAt: string): string {
    if (!playedAt) return '—';
    const d = new Date(playedAt);
    return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
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

  getTrackCoverClass(indexOrId: number): string {
    return 'cover--' + ((indexOrId % 6) + 1);
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
