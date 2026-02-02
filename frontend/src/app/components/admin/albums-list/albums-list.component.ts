import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AlbumService } from '../../../services/album.service';
import { AlbumSummaryResponse } from '../../../models/album.model';

@Component({
  selector: 'app-albums-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './albums-list.component.html',
  styleUrls: ['./albums-list.component.css']
})
export class AlbumsListComponent implements OnInit {
  albums: AlbumSummaryResponse[] = [];
  totalElements = 0;
  totalPages = 0;
  currentPage = 0;
  size = 20;
  searchQuery = '';
  isLoading = false;
  errorMessage = '';

  constructor(private albumService: AlbumService) {}

  ngOnInit(): void {
    this.loadPage();
  }

  loadPage(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.albumService.getPage(this.currentPage, this.size, this.searchQuery || undefined).subscribe({
      next: (res) => {
        this.albums = res.content;
        this.totalElements = res.totalElements;
        this.totalPages = res.totalPages;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Не удалось загрузить список';
        this.isLoading = false;
      }
    });
  }

  onSearch(): void {
    this.currentPage = 0;
    this.loadPage();
  }

  prevPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadPage();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.loadPage();
    }
  }
}
