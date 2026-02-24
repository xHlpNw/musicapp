import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface CreateRoomPayload {
  name: string;
  isPrivate: boolean;
  password?: string;
  allowAddTracks?: boolean;
  allowSkip?: boolean;
}

@Component({
  selector: 'app-create-room-overlay',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-room-overlay.component.html',
  styleUrls: ['./create-room-overlay.component.css']
})
export class CreateRoomOverlayComponent implements OnChanges {
  @Input() isOpen = false;
  @Output() closeOverlay = new EventEmitter<void>();
  @Output() create = new EventEmitter<CreateRoomPayload>();

  /** Для анимации появления: добавляется после вставки в DOM */
  isAnimated = false;

  name = '';
  isPrivate = false;
  password = '';
  allowAddTracks = true;
  allowSkip = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']?.currentValue === true) {
      this.isAnimated = false;
      requestAnimationFrame(() => {
        this.isAnimated = true;
      });
    }
  }

  get canCreate(): boolean {
    const nameOk = this.name.trim().length > 0;
    const passwordOk = !this.isPrivate || this.password.trim().length > 0;
    return nameOk && passwordOk;
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('create-room-overlay')) {
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
    if (!this.canCreate) return;
    this.create.emit({
      name: this.name.trim(),
      isPrivate: this.isPrivate,
      password: this.isPrivate ? this.password.trim() : undefined,
      allowAddTracks: this.allowAddTracks,
      allowSkip: this.allowSkip
    });
    this.closeOverlay.emit();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isOpen) this.doClose();
  }
}
