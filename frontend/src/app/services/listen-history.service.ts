import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ListenHistoryItem, PageResponse } from '../models/listen-history.model';

@Injectable({
  providedIn: 'root'
})
export class ListenHistoryService {
  private readonly API_URL = '/api/listen-history';

  constructor(private http: HttpClient) {}

  /** POST запись прослушивания. Ответ 204 No Content. */
  recordPlay(trackId: number): Observable<void> {
    return this.http
      .post(`${this.API_URL}/tracks/${trackId}`, null, { responseType: 'text' })
      .pipe(map(() => undefined));
  }

  getHistory(page = 0, size = 20): Observable<PageResponse<ListenHistoryItem>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<PageResponse<ListenHistoryItem>>(this.API_URL, { params });
  }
}
