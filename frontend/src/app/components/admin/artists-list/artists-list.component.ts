import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ArtistService } from '../../../services/artist.service';
import { ArtistResponse } from '../../../models/artist.model';

@Component({
  selector: 'app-artists-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './artists-list.component.html',
  styleUrls: ['./artists-list.component.css']
})
export class ArtistsListComponent implements OnInit {
  artists: ArtistResponse[] = [];
  totalElements = 0;
  totalPages = 0;
  currentPage = 0;
  size = 20;
  searchQuery = '';
  isLoading = false;
  errorMessage = '';

  constructor(private artistService: ArtistService) {}

  ngOnInit(): void {
    this.loadPage();
  }

  loadPage(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.artistService.getPage(this.currentPage, this.size, this.searchQuery || undefined).subscribe({
      next: (res) => {
        this.artists = res.content;
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
