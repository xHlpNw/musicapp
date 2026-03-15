import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TrackResponse, PageResponse } from '../models/track.model';

@Injectable({
  providedIn: 'root'
})
export class TrackService {
  private readonly API_URL = '/api/tracks';

  constructor(private http: HttpClient) {}

  getPage(page = 0, size = 20, q?: string, sort?: string): Observable<PageResponse<TrackResponse>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    if (q?.trim()) {
      params = params.set('q', q.trim());
    }
    if (sort) {
      params = params.set('sort', sort);
    }
    return this.http.get<PageResponse<TrackResponse>>(this.API_URL, { params });
  }

  getById(id: number): Observable<TrackResponse> {
    return this.http.get<TrackResponse>(`${this.API_URL}/${id}`);
  }

  /** Стрим трека (с авторизацией через interceptor). Для плеера — загрузить в Blob и создать object URL. */
  getStreamBlob(id: number): Observable<Blob> {
    return this.http.get(`${this.API_URL}/${id}/stream`, { responseType: 'blob' });
  }

  upload(formData: FormData): Observable<TrackResponse> {
    return this.http.post<TrackResponse>(this.API_URL, formData);
  }

  update(
    id: number,
    body: {
      title: string;
      durationSeconds: number;
      albumId: number;
      position: number;
      artists: { artistId: number; displayOrder: number; role: string }[];
    }
  ): Observable<TrackResponse> {
    return this.http.put<TrackResponse>(`${this.API_URL}/${id}`, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }

  /** Заменить аудиофайл (только для админа). */
  replaceAudio(id: number, file: File): Observable<TrackResponse> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<TrackResponse>(`${this.API_URL}/${id}/audio`, fd);
  }
}
