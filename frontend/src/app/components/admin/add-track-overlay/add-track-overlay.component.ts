import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { TrackService } from '../../../services/track.service';
import { ArtistService } from '../../../services/artist.service';
import { ArtistResponse } from '../../../models/artist.model';

export interface ParticipantRow {
  artistId: number | null;
  role: 'PRIMARY' | 'FEATURED';
}

export interface AddTrackData {
  albumId: number;
  albumTitle: string;
  nextPosition: number;
  artists: { artistId: number; role: 'PRIMARY' | 'FEATURED' }[];
}

@Component({
  selector: 'app-add-track-overlay',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './add-track-overlay.component.html',
  styleUrls: ['./add-track-overlay.component.css']
})
export class AddTrackOverlayComponent implements OnChanges, OnInit {
  @Input() isOpen = false;
  @Input() data: AddTrackData | null = null;
  @Output() closeOverlay = new EventEmitter<void>();
  @Output() trackAdded = new EventEmitter<void>();

  isAnimated = false;
  form: FormGroup;
  artistsCatalog: ArtistResponse[] = [];
  participants: ParticipantRow[] = [];
  isLoadingArtists = false;
  errorMessage = '';
  isLoading = false;
  selectedFile: File | null = null;
  newArtistName = '';
  creatingArtist = false;

  constructor(
    private fb: FormBuilder,
    private trackService: TrackService,
    private artistService: ArtistService
  ) {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(255)]],
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

  ngOnInit(): void {
    this.loadArtists();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']?.currentValue === true) {
      this.isAnimated = false;
      requestAnimationFrame(() => {
        this.isAnimated = true;
      });
      this.resetForm();
    }
    if (changes['data'] && this.data) {
      this.initializeFromData();
    }
  }

  resetForm(): void {
    this.form.reset();
    this.selectedFile = null;
    this.errorMessage = '';
    this.newArtistName = '';
    if (this.data) {
      this.initializeFromData();
    }
  }

  initializeFromData(): void {
    if (!this.data) return;
    
    this.form.patchValue({
      position: this.data.nextPosition,
      title: '',
      durationSeconds: null
    });

    if (this.data.artists && this.data.artists.length > 0) {
      this.participants = this.data.artists.map((a) => ({
        artistId: a.artistId,
        role: a.role
      }));
    } else {
      this.participants = [{ artistId: null, role: 'PRIMARY' }];
    }
  }

  loadArtists(): void {
    this.isLoadingArtists = true;
    this.artistService.getPage(0, 500).subscribe({
      next: (res) => {
        this.artistsCatalog = res.content;
        this.isLoadingArtists = false;
      },
      error: () => {
        this.isLoadingArtists = false;
      }
    });
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('add-track-overlay')) {
      this.doClose();
    }
  }

  onPanelClick(event: MouseEvent): void {
    event.stopPropagation();
  }

  doClose(): void {
    if (!this.isLoading) {
      this.closeOverlay.emit();
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.length ? input.files[0] : null;
  }

  onParticipantRoleChange(row: ParticipantRow): void {
    if (row.role === 'PRIMARY') {
      this.participants.forEach((p) => {
        if (p !== row) p.role = 'FEATURED';
      });
    } else if (!this.participants.some((p) => p.role === 'PRIMARY')) {
      const first = this.participants.find((p) => p.artistId) || this.participants[0];
      if (first) first.role = 'PRIMARY';
    }
  }

  addParticipant(): void {
    this.participants.push({ artistId: null, role: 'FEATURED' });
  }

  removeParticipant(index: number): void {
    if (this.participants.length <= 1) return;
    this.participants.splice(index, 1);
    this.participants.forEach((p) => (p.role = 'FEATURED'));
    const first = this.participants.find((p) => p.artistId) || this.participants[0];
    if (first) first.role = 'PRIMARY';
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
      },
      error: (err) => {
        this.creatingArtist = false;
        this.errorMessage = err.error?.error || 'Не удалось создать';
      }
    });
  }

  private validateParticipants(): string | null {
    const withId = this.participants.filter((p) => p.artistId != null);
    if (withId.length === 0) return 'Нужен хотя бы один исполнитель';
    if (this.participants.filter((p) => p.role === 'PRIMARY' && p.artistId).length !== 1) {
      return 'Ровно один основной исполнитель';
    }
    const ids = withId.map((p) => p.artistId!);
    if (new Set(ids).size !== ids.length) return 'Исполнители не должны повторяться';
    return null;
  }

  onSubmit(): void {
    if (this.form.invalid || !this.data) {
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
    fd.append('albumId', String(this.data.albumId));
    fd.append('position', String(v.position ?? 1));
    fd.append('durationSeconds', String(v.durationSeconds));

    const ordered = this.participants.filter((p) => p.artistId != null);
    for (const p of ordered) {
      fd.append('artistIds', String(p.artistId));
      fd.append('roles', p.role);
    }

    this.trackService.upload(fd).subscribe({
      next: () => {
        this.isLoading = false;
        this.trackAdded.emit();
        this.doClose();
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
      this.participants.some((p) => p.artistId)
    );
  }
}
