import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, HostListener, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoomResponse } from '../../models/room.model';
import { RoomService } from '../../services/room.service';

@Component({
  selector: 'app-room-settings-overlay',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './room-settings-overlay.component.html',
  styleUrls: ['./room-settings-overlay.component.css']
})
export class RoomSettingsOverlayComponent implements OnChanges {
  @ViewChild('coverInput') coverInputRef?: ElementRef<HTMLInputElement>;

  @Input() isOpen = false;
  @Input() room: RoomResponse | null = null;
  @Output() closeOverlay = new EventEmitter<void>();
  @Output() save = new EventEmitter<{ name: string; maxMembers: number | null }>();
  @Output() coverUpdated = new EventEmitter<RoomResponse>();

  private roomService = inject(RoomService);

  isAnimated = false;
  name = '';
  maxMembersInput: string = '';
  coverUploading = false;
  coverDeleting = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']?.currentValue === true && this.room) {
      this.name = this.room.name;
      this.maxMembersInput = this.room.maxMembers != null ? String(this.room.maxMembers) : '';
      this.isAnimated = false;
      requestAnimationFrame(() => {
        this.isAnimated = true;
      });
    }
  }

  get canSave(): boolean {
    return this.name.trim().length > 0;
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('room-settings-overlay')) {
      this.doClose();
    }
  }

  onPanelClick(event: MouseEvent): void {
    event.stopPropagation();
  }

  doClose(): void {
    this.closeOverlay.emit();
  }

  onSubmit(): void {
    if (!this.canSave) return;
    const maxMembers = this.maxMembersInput.trim() === ''
      ? null
      : Math.max(1, Math.min(999, parseInt(this.maxMembersInput, 10) || 1));
    this.save.emit({ name: this.name.trim(), maxMembers });
    this.closeOverlay.emit();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isOpen) this.doClose();
  }

  getCoverUrl(path: string | undefined | null): string {
    if (!path) return '';
    return path.startsWith('http') ? path : '/api/covers/' + path;
  }

  openCoverInput(): void {
    this.coverInputRef?.nativeElement?.click();
  }

  onCoverFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file || !this.room) return;
    this.coverUploading = true;
    this.roomService.uploadCover(this.room.id, file).subscribe({
      next: (updated) => {
        this.coverUploading = false;
        this.coverUpdated.emit(updated);
      },
      error: () => {
        this.coverUploading = false;
      }
    });
  }

  removeCover(): void {
    if (!this.room || this.coverDeleting) return;
    this.coverDeleting = true;
    this.roomService.deleteCover(this.room.id).subscribe({
      next: (updated) => {
        this.coverDeleting = false;
        this.coverUpdated.emit(updated);
      },
      error: () => {
        this.coverDeleting = false;
      }
    });
  }
}
