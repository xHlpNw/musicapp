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

  getPage(page = 0, size = 20, q?: string): Observable<PageResponse<TrackResponse>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    if (q?.trim()) {
      params = params.set('q', q.trim());
    }
    return this.http.get<PageResponse<TrackResponse>>(this.API_URL, { params });
  }

  getById(id: number): Observable<TrackResponse> {
    return this.http.get<TrackResponse>(`${this.API_URL}/${id}`);
  }

  upload(formData: FormData): Observable<TrackResponse> {
    return this.http.post<TrackResponse>(this.API_URL, formData);
  }
}
