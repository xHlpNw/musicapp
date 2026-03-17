import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AlbumService } from '../../../services/album.service';
import { ArtistService } from '../../../services/artist.service';
import { TrackService } from '../../../services/track.service';
import { ArtistResponse } from '../../../models/artist.model';
import { AddTrackOverlayComponent, AddTrackData } from '../add-track-overlay/add-track-overlay.component';
import { SelectTrackOverlayComponent, SelectTrackData } from '../select-track-overlay/select-track-overlay.component';

export interface ParticipantRow {
  artistId: number | null;
  role: 'PRIMARY' | 'FEATURED';
}

export interface AlbumTrackRow {
  id: number;
  title: string;
  position: number;
  durationSeconds: number;
  artists: { artistId: number; displayOrder: number; role: string }[];
}

@Component({
  selector: 'app-album-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink, AddTrackOverlayComponent, SelectTrackOverlayComponent],
  templateUrl: './album-form.component.html',
  styleUrls: ['./album-form.component.css']
})
export class AlbumFormComponent implements OnInit {
  form: FormGroup;
  artists: ArtistResponse[] = [];
  participants: ParticipantRow[] = [{ artistId: null, role: 'PRIMARY' }];
  tracks: AlbumTrackRow[] = [];
  isLoadingArtists = false;
  errorMessage = '';
  isLoading = false;
  isEditMode = false;
  albumId: number | null = null;
  /** Текущая обложка (относительный путь) — превью и чтобы не терять при сохранении без нового файла */
  currentCoverPath: string | null = null;
  selectedCoverFile: File | null = null;
  newArtistName = '';
  creatingArtist = false;
  deletingTrackId: number | null = null;
  trackPositionsDirty = false;
  isAddTrackOverlayOpen = false;
  addTrackData: AddTrackData | null = null;
  isSelectTrackOverlayOpen = false;
  selectTrackData: SelectTrackData | null = null;

  constructor(
    private fb: FormBuilder,
    private albumService: AlbumService,
    private artistService: ArtistService,
    private trackService: TrackService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(255)]],
      releaseYear: [null as number | null]
    });
  }

  get title() {
    return this.form.get('title');
  }

  /** URL превью обложки в админке */
  get coverPreviewUrl(): string | null {
    if (!this.currentCoverPath) return null;
    const p = this.currentCoverPath.replace(/^\//, '');
    return `/api/covers/${p}?v=${this.albumId ?? 0}`;
  }

  formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  openAddTrackOverlay(): void {
    if (!this.albumId) return;
    
    this.addTrackData = {
      albumId: this.albumId,
      albumTitle: this.form.get('title')?.value || 'Альбом',
      nextPosition: this.tracks.length + 1,
      artists: this.participants
        .filter(p => p.artistId != null)
        .map(p => ({ artistId: p.artistId!, role: p.role }))
    };
    this.isAddTrackOverlayOpen = true;
  }

  closeAddTrackOverlay(): void {
    this.isAddTrackOverlayOpen = false;
  }

  onTrackAdded(): void {
    // Перезагружаем альбом чтобы обновить список треков
    if (this.albumId) {
      this.albumService.getById(this.albumId).subscribe({
        next: (album) => {
          if (album.tracks && album.tracks.length > 0) {
            this.tracks = album.tracks
              .map((t) => this.mapTrackSummary(t))
              .sort((a, b) => a.position - b.position);
            this.trackPositionsDirty = false;
          }
        }
      });
    }
  }

  openSelectTrackOverlay(): void {
    if (!this.albumId) return;
    
    this.selectTrackData = {
      albumId: this.albumId,
      albumTitle: this.form.get('title')?.value || 'Альбом',
      nextPosition: this.tracks.length + 1
    };
    this.isSelectTrackOverlayOpen = true;
  }

  closeSelectTrackOverlay(): void {
    this.isSelectTrackOverlayOpen = false;
  }

  onTrackSelected(): void {
    // Перезагружаем альбом чтобы обновить список треков
    this.onTrackAdded();
  }

  ngOnInit(): void {
    this.loadArtists();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.albumId = +id;
      this.isEditMode = true;
      this.albumService.getById(this.albumId).subscribe({
        next: (album) => {
          const year = album.releaseDate ? parseInt(album.releaseDate.toString().slice(0, 4), 10) : null;
          this.form.patchValue({
            title: album.title ?? '',
            releaseYear: year ?? (album as { releaseYear?: number }).releaseYear ?? null
          });
          this.currentCoverPath = album.coverImagePath ?? null;
          
          // Загружаем участников
          const sorted = [...(album.artists || [])].sort(
            (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)
          );
          if (sorted.length > 0) {
            this.participants = sorted.map((a) => ({
              artistId: a.artistId,
              role: (a.role === 'PRIMARY' || a.role === 'primary' ? 'PRIMARY' : 'FEATURED') as 'PRIMARY' | 'FEATURED'
            }));
          } else {
            this.participants = [{ artistId: null, role: 'PRIMARY' }];
          }
          
          // Загружаем треки
          if (album.tracks && album.tracks.length > 0) {
            this.tracks = album.tracks
              .map((t) => this.mapTrackSummary(t))
              .sort((a, b) => a.position - b.position);
            this.trackPositionsDirty = false;
          }
        },
        error: () => {
          this.errorMessage = 'Альбом не найден';
        }
      });
    }
  }

  loadArtists(): void {
    this.isLoadingArtists = true;
    this.artistService.getPage(0, 500).subscribe({
      next: (res) => {
        this.artists = res.content;
        this.isLoadingArtists = false;
      },
      error: () => {
        this.isLoadingArtists = false;
      }
    });
  }

  onCoverFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedCoverFile = input.files?.length ? input.files[0] : null;
  }

  private buildReleaseDate(): string {
    const y = this.form.get('releaseYear')?.value;
    const year = y != null && !isNaN(y) ? Number(y) : new Date().getFullYear();
    return `${year}-01-01`;
  }

  private buildArtists(): { artistId: number; displayOrder: number; role: string }[] {
    const withId = this.participants.filter((p) => p.artistId != null);
    return withId.map((p, i) => ({
      artistId: p.artistId!,
      displayOrder: i,
      role: p.role
    }));
  }

  private navigateToList(): void {
    this.router.navigate(['/admin/albums']);
  }

  private navigateToEdit(albumId: number): void {
    this.router.navigate(['/admin/albums', albumId, 'edit']);
  }

  // === Методы для работы с участниками ===

  onParticipantRoleChange(_row: ParticipantRow): void {
    // Ограничение на единственный PRIMARY снято — роли задаются свободно
  }

  addParticipant(): void {
    this.participants.push({ artistId: null, role: 'FEATURED' });
  }

  removeParticipant(index: number): void {
    if (this.participants.length <= 1) return;
    this.participants.splice(index, 1);
  }

  moveParticipantUp(index: number): void {
    if (index <= 0) return;
    [this.participants[index - 1], this.participants[index]] = [
      this.participants[index],
      this.participants[index - 1]
    ];
  }

  moveParticipantDown(index: number): void {
    if (index >= this.participants.length - 1) return;
    [this.participants[index], this.participants[index + 1]] = [
      this.participants[index + 1],
      this.participants[index]
    ];
  }

  createNewArtist(): void {
    const name = this.newArtistName.trim();
    if (!name) {
      this.errorMessage = 'Введите имя';
      return;
    }
    this.creatingArtist = true;
    this.errorMessage = '';
    this.artistService.create({ name }).subscribe({
      next: (a) => {
        this.artists = [...this.artists, a].sort((x, y) =>
          x.name.localeCompare(y.name, 'ru')
        );
        const empty = this.participants.find((p) => !p.artistId);
        if (empty) empty.artistId = a.id;
        else this.participants.push({ artistId: a.id, role: 'FEATURED' });
        this.newArtistName = '';
        this.creatingArtist = false;
      },
      error: (err) => {
        this.creatingArtist = false;
        this.errorMessage = err.error?.error || 'Не удалось создать';
      }
    });
  }

  // === Методы для работы с треками ===

  moveTrackUp(index: number): void {
    if (index <= 0) return;
    [this.tracks[index - 1], this.tracks[index]] = [
      this.tracks[index],
      this.tracks[index - 1]
    ];
    this.updateTrackPositions();
    this.trackPositionsDirty = true;
  }

  moveTrackDown(index: number): void {
    if (index >= this.tracks.length - 1) return;
    [this.tracks[index], this.tracks[index + 1]] = [
      this.tracks[index + 1],
      this.tracks[index]
    ];
    this.updateTrackPositions();
    this.trackPositionsDirty = true;
  }

  private updateTrackPositions(): void {
    this.tracks.forEach((t, i) => {
      t.position = i + 1;
    });
  }

  private mapTrackSummary(t: NonNullable<import('../../../models/album.model').AlbumResponse['tracks']>[number]): AlbumTrackRow {
    return {
      id: t.id,
      title: t.title,
      position: t.position ?? t.trackNumber ?? 0,
      durationSeconds: t.durationSeconds,
      artists: (t.artists ?? []).map((a, i) => ({
        artistId: a.artistId,
        displayOrder: a.displayOrder ?? i,
        role: a.role ?? 'FEATURED'
      }))
    };
  }

  removeTrack(track: AlbumTrackRow): void {
    if (!confirm(`Удалить трек "${track.title}"?`)) return;
    this.deletingTrackId = track.id;
    this.trackService.delete(track.id).subscribe({
      next: () => {
        this.tracks = this.tracks.filter((t) => t.id !== track.id);
        this.updateTrackPositions();
        this.trackPositionsDirty = true;
        this.deletingTrackId = null;
      },
      error: (err) => {
        this.deletingTrackId = null;
        this.errorMessage = err.error?.error || 'Не удалось удалить трек';
      }
    });
  }

  private validateParticipants(): string | null {
    const withId = this.participants.filter((p) => p.artistId != null);
    if (withId.length === 0) return 'Нужен хотя бы один исполнитель';
    const ids = withId.map((p) => p.artistId!);
    if (new Set(ids).size !== ids.length) return 'Исполнители не должны повторяться';
    return null;
  }

  private saveTrackPositions(): void {
    if (!this.isEditMode || !this.trackPositionsDirty || this.tracks.length === 0) return;
    this.tracks.forEach((track, index) => {
      this.trackService.update(track.id, {
        title: track.title,
        durationSeconds: track.durationSeconds,
        albumId: this.albumId!,
        position: index + 1,
        artists: track.artists
      }).subscribe();
    });
  }

  private uploadCoverIfNeeded(albumId: number, then: () => void): void {
    if (this.selectedCoverFile) {
      this.albumService.uploadCover(albumId, this.selectedCoverFile).subscribe({
        next: () => then(),
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err.error?.error || 'Ошибка при загрузке обложки';
        }
      });
    } else {
      then();
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const pe = this.validateParticipants();
    if (pe) {
      this.errorMessage = pe;
      return;
    }
    this.isLoading = true;
    this.errorMessage = '';
    const value = this.form.value;
    const releaseDate = this.buildReleaseDate();
    const artists = this.buildArtists();

    if (this.isEditMode && this.albumId != null) {
      // Сначала сохраняем позиции треков, затем альбом
      this.saveTrackPositions();
      this.albumService
        .update(this.albumId, {
          title: value.title,
          releaseDate,
          artists
        })
        .subscribe({
          next: () =>
            this.uploadCoverIfNeeded(this.albumId!, () => {
              this.navigateToList();
            }),
          error: (err) => {
            this.isLoading = false;
            this.errorMessage = err.error?.error || 'Ошибка при сохранении';
          }
        });
    } else {
      this.albumService
        .create({
          title: value.title,
          releaseDate,
          artists
        })
        .subscribe({
          next: (album) =>
            this.uploadCoverIfNeeded(album.id, () => {
              this.navigateToEdit(album.id);
            }),
          error: (err) => {
            this.isLoading = false;
            this.errorMessage = err.error?.error || 'Ошибка при создании';
          }
        });
    }
  }
}
