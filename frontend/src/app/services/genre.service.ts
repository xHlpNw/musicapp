import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface GenreResponse {
  id: number;
  name: string;
  parentId?: number | null;
  childrenIds?: number[];
}

export interface GenrePageResponse {
  content: GenreResponse[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

@Injectable({ providedIn: 'root' })
export class GenreService {
  private readonly API_URL = '/api/genres';

  constructor(private http: HttpClient) {}

  getPage(page = 0, size = 20, q?: string): Observable<GenrePageResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    if (q?.trim()) params = params.set('q', q.trim());
    return this.http.get<GenrePageResponse>(this.API_URL, { params });
  }

  getAll(): Observable<GenrePageResponse> {
    return this.getPage(0, 500);
  }

  getById(id: number): Observable<GenreResponse> {
    return this.http.get<GenreResponse>(`${this.API_URL}/${id}`);
  }

  create(body: { name: string; parentId?: number | null }): Observable<GenreResponse> {
    return this.http.post<GenreResponse>(this.API_URL, body);
  }

  update(id: number, body: { name: string; parentId?: number | null }): Observable<GenreResponse> {
    return this.http.put<GenreResponse>(`${this.API_URL}/${id}`, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}
