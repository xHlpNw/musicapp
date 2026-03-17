import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { TrackService } from '../../../services/track.service';
import { ArtistService } from '../../../services/artist.service';
import { AlbumService } from '../../../services/album.service';
import { ArtistResponse } from '../../../models/artist.model';
import { AlbumSummaryResponse } from '../../../models/album.model';
import { ParticipantRow } from '../track-upload/track-upload.component';

@Component({
  selector: 'app-track-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink],
  templateUrl: './track-edit.component.html',
  styleUrls: ['./track-edit.component.css']
})
export class TrackEditComponent implements OnInit {
  form: FormGroup;
  artistsCatalog: ArtistResponse[] = [];
  albums: AlbumSummaryResponse[] = [];
  participants: ParticipantRow[] = [];
  isLoadingArtists = false;
  errorMessage = '';
  isLoading = false;
  trackId: number | null = null;
  selectedAudioFile: File | null = null;
  selectedCoverFile: File | null = null;
  currentCoverPath: string | null = null;
  newArtistName = '';
  creatingArtist = false;
  private loadedAlbumId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private trackService: TrackService,
    private artistService: ArtistService,
    private albumService: AlbumService,
    private router: Router,
    private route: ActivatedRoute
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

  get coverPreviewUrl(): string | null {
    if (!this.currentCoverPath) return null;
    const p = this.currentCoverPath.replace(/^\//, '');
    return `/api/covers/${p}?v=${this.trackId ?? 0}`;
  }

  onCoverFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedCoverFile = input.files?.length ? input.files[0] : null;
  }

  referenceArtistId(): number | null {
    const primary = this.participants.find((p) => p.role === 'PRIMARY' && p.artistId);
    if (primary?.artistId) return primary.artistId;
    const any = this.participants.find((p) => p.artistId);
    return any?.artistId ?? null;
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.errorMessage = 'Не указан трек';
      return;
    }
    this.trackId = +id;
    this.isLoadingArtists = true;
    this.artistService.getPage(0, 500).subscribe({
      next: (res) => {
        this.artistsCatalog = res.content;
        this.isLoadingArtists = false;
        this.trackService.getById(this.trackId!).subscribe({
          next: (track) => {
            const at = track.albumTracks?.[0];
            if (!at) {
              this.errorMessage = 'У трека нет привязки к альбому';
              return;
            }
            this.loadedAlbumId = at.albumId;
            const sorted = [...(track.artists || [])].sort(
              (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)
            );
            if (sorted.length === 0) {
              this.errorMessage = 'У трека нет исполнителей';
              return;
            }
            this.participants = sorted.map((a) => ({
              artistId: a.artistId,
              role: (a.role === 'PRIMARY' || a.role === 'primary' ? 'PRIMARY' : 'FEATURED') as
                | 'PRIMARY'
                | 'FEATURED'
            }));
            this.currentCoverPath = track.coverImagePath ?? null;
            this.form.patchValue({
              title: track.title,
              durationSeconds: track.durationSeconds,
              position: at.position ?? 1,
              albumId: at.albumId ?? null
            });
            this.refreshAlbumsAfterLoad();
          },
          error: () => {
            this.errorMessage = 'Трек не найден';
          }
        });
      },
      error: () => {
        this.isLoadingArtists = false;
      }
    });
  }

  private refreshAlbumsAfterLoad(): void {
    const aid = this.referenceArtistId();
    if (!aid || !this.loadedAlbumId) return;
    this.albumService.getByArtistId(aid).subscribe({
      next: (list) => {
        this.albums = list;
        if (!list.some((a) => a.id === this.loadedAlbumId)) {
          this.albums = [
            { id: this.loadedAlbumId!, title: 'Текущий альбом #' + this.loadedAlbumId },
            ...list
          ];
        }
      }
    });
  }

  onParticipantArtistChange(): void {
    const aid = this.referenceArtistId();
    if (!aid) return;
    this.albumService.getByArtistId(aid).subscribe({
      next: (list) => {
        this.albums = list;
        if (this.loadedAlbumId && !list.some((a) => a.id === this.loadedAlbumId)) {
          this.albums = [
            { id: this.loadedAlbumId, title: '#' + this.loadedAlbumId },
            ...list
          ];
        }
      }
    });
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
    this.onParticipantArtistChange();
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
        this.artistsCatalog = [...this.artistsCatalog, a].sort((x, y) =>
          x.name.localeCompare(y.name, 'ru')
        );
        const empty = this.participants.find((p) => !p.artistId);
        if (empty) empty.artistId = a.id;
        else this.participants.push({ artistId: a.id, role: 'FEATURED' });
        this.newArtistName = '';
        this.creatingArtist = false;
        this.onParticipantArtistChange();
      },
      error: (err) => {
        this.creatingArtist = false;
        this.errorMessage = err.error?.error || 'Не удалось создать';
      }
    });
  }

  onAudioFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedAudioFile = input.files?.length ? input.files[0] : null;
  }

  private uploadFilesAndNavigate(): void {
    const uploadAudio = (then: () => void) => {
      if (this.selectedAudioFile) {
        this.trackService.replaceAudio(this.trackId!, this.selectedAudioFile).subscribe({
          next: () => then(),
          error: (err) => {
            this.isLoading = false;
            this.errorMessage = err.error?.error || 'Сохранено, но аудиофайл не заменён — попробуйте ещё раз.';
          }
        });
      } else {
        then();
      }
    };

    const uploadCover = (then: () => void) => {
      if (this.selectedCoverFile) {
        this.trackService.uploadCover(this.trackId!, this.selectedCoverFile).subscribe({
          next: () => then(),
          error: (err) => {
            this.isLoading = false;
            this.errorMessage = err.error?.error || 'Сохранено, но обложку загрузить не удалось.';
          }
        });
      } else {
        then();
      }
    };

    uploadAudio(() => uploadCover(() => this.router.navigate(['/admin/tracks'])));
  }

  private validateParticipants(): string | null {
    const withId = this.participants.filter((p) => p.artistId != null);
    if (withId.length === 0) return 'Нужен хотя бы один исполнитель';
    const ids = withId.map((p) => p.artistId!);
    if (new Set(ids).size !== ids.length) return 'Исполнители не должны повторяться';
    return null;
  }

  onSubmit(): void {
    if (this.form.invalid || this.trackId == null) {
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
    const v = this.form.value;
    const ordered = this.participants.filter((p) => p.artistId != null);
    const payload = {
      title: v.title,
      durationSeconds: Number(v.durationSeconds),
      albumId: Number(v.albumId),
      position: Number(v.position),
      artists: ordered.map((p, i) => ({
        artistId: p.artistId!,
        displayOrder: i,
        role: p.role
      }))
    };

    this.trackService.update(this.trackId, payload).subscribe({
      next: () => this.uploadFilesAndNavigate(),
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.error || 'Ошибка сохранения';
      }
    });
  }
}
