import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TrackService } from '../../../services/track.service';
import { AlbumService } from '../../../services/album.service';
import { TrackResponse } from '../../../models/track.model';

export interface SelectTrackData {
  albumId: number;
  albumTitle: string;
  nextPosition: number;
}

@Component({
  selector: 'app-select-track-overlay',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './select-track-overlay.component.html',
  styleUrls: ['./select-track-overlay.component.css']
})
export class SelectTrackOverlayComponent implements OnChanges, OnInit {
  @Input() isOpen = false;
  @Input() data: SelectTrackData | null = null;
  @Output() closeOverlay = new EventEmitter<void>();
  @Output() trackSelected = new EventEmitter<void>();

  isAnimated = false;
  tracks: TrackResponse[] = [];
  filteredTracks: TrackResponse[] = [];
  isLoading = false;
  errorMessage = '';
  searchQuery = '';
  selectedTrackId: number | null = null;
  isAdding = false;

  constructor(
    private trackService: TrackService,
    private albumService: AlbumService
  ) {}

  ngOnInit(): void {
    this.loadTracks();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']?.currentValue === true) {
      this.isAnimated = false;
      requestAnimationFrame(() => {
        this.isAnimated = true;
      });
      this.reset();
    }
  }

  reset(): void {
    this.searchQuery = '';
    this.selectedTrackId = null;
    this.errorMessage = '';
    this.filterTracks();
  }

  loadTracks(): void {
    this.isLoading = true;
    this.trackService.getPage(0, 1000).subscribe({
      next: (response) => {
        this.tracks = response.content;
        this.filterTracks();
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Ошибка загрузки треков';
        this.isLoading = false;
      }
    });
  }

  filterTracks(): void {
    const query = this.searchQuery.toLowerCase().trim();
    if (!query) {
      this.filteredTracks = this.tracks;
    } else {
      this.filteredTracks = this.tracks.filter(track =>
        track.title.toLowerCase().includes(query) ||
        track.artistName?.toLowerCase().includes(query) ||
        track.albumTitle?.toLowerCase().includes(query)
      );
    }
  }

  onSearchChange(): void {
    this.filterTracks();
  }

  selectTrack(trackId: number): void {
    this.selectedTrackId = trackId;
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('select-track-overlay')) {
      this.doClose();
    }
  }

  onPanelClick(event: MouseEvent): void {
    event.stopPropagation();
  }

  doClose(): void {
    if (!this.isAdding) {
      this.closeOverlay.emit();
    }
  }

  onSubmit(): void {
    if (!this.selectedTrackId || !this.data) return;

    this.isAdding = true;
    this.errorMessage = '';

    this.albumService.addTrack(this.data.albumId, this.selectedTrackId, this.data.nextPosition).subscribe({
      next: () => {
        this.isAdding = false;
        this.trackSelected.emit();
        this.doClose();
      },
      error: (err) => {
        this.isAdding = false;
        this.errorMessage = err.error?.error || 'Не удалось добавить трек';
      }
    });
  }

  formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
}
