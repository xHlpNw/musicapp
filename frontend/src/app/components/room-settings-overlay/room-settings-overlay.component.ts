import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoomResponse } from '../../models/room.model';

@Component({
  selector: 'app-room-settings-overlay',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './room-settings-overlay.component.html',
  styleUrls: ['./room-settings-overlay.component.css']
})
export class RoomSettingsOverlayComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() room: RoomResponse | null = null;
  @Output() closeOverlay = new EventEmitter<void>();
  @Output() save = new EventEmitter<{ name: string; maxMembers: number | null }>();

  isAnimated = false;
  name = '';
  maxMembersInput: string = '';

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
}
