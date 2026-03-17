import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TrackService } from '../../../services/track.service';
import { ArtistService } from '../../../services/artist.service';
import { AlbumService } from '../../../services/album.service';
import { ArtistResponse } from '../../../models/artist.model';
import { AlbumSummaryResponse } from '../../../models/album.model';

export interface ParticipantRow {
  artistId: number | null;
  role: 'PRIMARY' | 'FEATURED';
}

@Component({
  selector: 'app-track-upload',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink],
  templateUrl: './track-upload.component.html',
  styleUrls: ['./track-upload.component.css']
})
export class TrackUploadComponent implements OnInit {
  form: FormGroup;
  /** Каталог исполнителей (для select) */
  artistsCatalog: ArtistResponse[] = [];
  albums: AlbumSummaryResponse[] = [];
  participants: ParticipantRow[] = [{ artistId: null, role: 'PRIMARY' }];
  isLoadingArtists = false;
  errorMessage = '';
  isLoading = false;
  selectedFile: File | null = null;
  selectedCoverFile: File | null = null;
  newArtistName = '';
  creatingArtist = false;

  constructor(
    private fb: FormBuilder,
    private trackService: TrackService,
    private artistService: ArtistService,
    private albumService: AlbumService,
    private router: Router
  ) {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(255)]],
      albumId: [null as number | null, Validators.required],
      position: [1, [Validators.required, Validators.min(1)]],
      durationSeconds: [null as number | null, [Validators.required, Validators.min(1)]]
    });
  }

  get title() {
    return this.form.get('title');
  }

  get durationSeconds() {
    return this.form.get('durationSeconds');
  }

  get albumId() {
    return this.form.get('albumId');
  }

  ngOnInit(): void {
    this.loadArtists();
  }

  loadArtists(): void {
    this.isLoadingArtists = true;
    this.artistService.getPage(0, 500).subscribe({
      next: (res) => {
        this.artistsCatalog = res.content;
        this.isLoadingArtists = false;
        this.refreshAlbums();
      },
      error: () => {
        this.isLoadingArtists = false;
      }
    });
  }

  /** Первый исполнитель с ролью PRIMARY и выбранным id, иначе первый с id */
  referenceArtistId(): number | null {
    const primary = this.participants.find((p) => p.role === 'PRIMARY' && p.artistId);
    if (primary?.artistId) return primary.artistId;
    const any = this.participants.find((p) => p.artistId);
    return any?.artistId ?? null;
  }

  refreshAlbums(): void {
    const aid = this.referenceArtistId();
    this.albums = [];
    this.form.patchValue({ albumId: null });
    if (aid) {
      this.albumService.getByArtistId(aid).subscribe({
        next: (list) => (this.albums = list)
      });
    }
  }

  onParticipantArtistChange(): void {
    this.refreshAlbums();
  }

  onParticipantRoleChange(_row: ParticipantRow): void {
    // Ограничение на единственный PRIMARY снято — роли задаются свободно
  }

  addParticipant(): void {
    this.participants.push({ artistId: null, role: 'FEATURED' });
  }

  removeParticipant(index: number): void {
    if (this.participants.length <= 1) return;
    this.participants.splice(index, 1);
    this.refreshAlbums();
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
      this.errorMessage = 'Введите имя исполнителя';
      return;
    }
    this.creatingArtist = true;
    this.errorMessage = '';
    this.artistService.create({ name }).subscribe({
      next: (a) => {
        this.artistsCatalog = [...this.artistsCatalog, a].sort((x, y) =>
          x.name.localeCompare(y.name, 'ru')
        );
        const empty = this.participants.find((p) => !p.artistId);
        if (empty) {
          empty.artistId = a.id;
        } else {
          this.participants.push({ artistId: a.id, role: 'FEATURED' });
        }
        this.newArtistName = '';
        this.creatingArtist = false;
        this.onParticipantArtistChange();
      },
      error: (err) => {
        this.creatingArtist = false;
        this.errorMessage = err.error?.error || 'Не удалось создать исполнителя';
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.selectedFile = input.files[0];
      this.detectAudioDuration(this.selectedFile);
    }
  }

  private detectAudioDuration(file: File): void {
    const audio = new Audio();
    const objectUrl = URL.createObjectURL(file);
    audio.preload = 'metadata';
    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(objectUrl);
      const seconds = Math.round(audio.duration);
      if (isFinite(seconds) && seconds > 0) {
        this.form.patchValue({ durationSeconds: seconds });
      }
    };
    audio.onerror = () => URL.revokeObjectURL(objectUrl);
    audio.src = objectUrl;
  }

  onCoverFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedCoverFile = input.files?.length ? input.files[0] : null;
  }

  private validateParticipants(): string | null {
    const withId = this.participants.filter((p) => p.artistId != null);
    if (withId.length === 0) return 'Добавьте хотя бы одного исполнителя';
    const ids = withId.map((p) => p.artistId!);
    if (new Set(ids).size !== ids.length) return 'Исполнители не должны повторяться';
    return null;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const partErr = this.validateParticipants();
    if (partErr) {
      this.errorMessage = partErr;
      return;
    }
    if (!this.selectedFile) {
      this.errorMessage = 'Выберите аудиофайл';
      return;
    }
    this.isLoading = true;
    this.errorMessage = '';

    const v = this.form.value;
    const fd = new FormData();
    fd.append('file', this.selectedFile);
    fd.append('title', v.title);
    fd.append('albumId', String(v.albumId));
    fd.append('position', String(v.position ?? 1));
    fd.append('durationSeconds', String(v.durationSeconds));

    const ordered = this.participants.filter((p) => p.artistId != null);
    for (const p of ordered) {
      fd.append('artistIds', String(p.artistId));
      fd.append('roles', p.role);
    }

    this.trackService.upload(fd).subscribe({
      next: (track) => {
        if (this.selectedCoverFile) {
          this.trackService.uploadCover(track.id, this.selectedCoverFile).subscribe({
            next: () => this.router.navigate(['/admin/tracks']),
            error: (err) => {
              this.isLoading = false;
              this.errorMessage = err.error?.error || 'Трек сохранён, но обложку загрузить не удалось';
            }
          });
        } else {
          this.router.navigate(['/admin/tracks']);
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.error || err.message || 'Ошибка при загрузке';
      }
    });
  }

  canSubmit(): boolean {
    return (
      !this.isLoading &&
      !this.isLoadingArtists &&
      this.artistsCatalog.length > 0 &&
      this.albums.length > 0 &&
      this.participants.some((p) => p.artistId)
    );
  }
}
