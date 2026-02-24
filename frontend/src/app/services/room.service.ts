import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RoomResponse, RoomPageResponse, CreateRoomRequest, UpdateRoomRequest, RoomStateRequest } from '../models/room.model';

@Injectable({
  providedIn: 'root'
})
export class RoomService {
  private readonly API_URL = '/api/rooms';

  constructor(private http: HttpClient) {}

  /** Список комнат: filter=all|open|mine, q=поиск, page, size. */
  getRooms(filter: 'all' | 'open' | 'mine' = 'all', q?: string, page = 0, size = 24): Observable<RoomPageResponse> {
    let params = new HttpParams()
      .set('filter', filter)
      .set('page', page.toString())
      .set('size', size.toString());
    if (q?.trim()) {
      params = params.set('q', q.trim());
    }
    return this.http.get<RoomPageResponse>(this.API_URL, { params });
  }

  /** Популярные комнаты. */
  getPopular(limit = 10): Observable<RoomResponse[]> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<RoomResponse[]>(`${this.API_URL}/popular`, { params });
  }

  /** Детали комнаты (только для участника). */
  getById(id: number): Observable<RoomResponse> {
    return this.http.get<RoomResponse>(`${this.API_URL}/${id}`);
  }

  /** Краткая информация о комнате (для не-участников). */
  getSummary(id: number): Observable<RoomResponse> {
    return this.http.get<RoomResponse>(`${this.API_URL}/${id}/summary`);
  }

  create(request: CreateRoomRequest): Observable<RoomResponse> {
    return this.http.post<RoomResponse>(this.API_URL, request);
  }

  update(id: number, request: UpdateRoomRequest): Observable<RoomResponse> {
    return this.http.patch<RoomResponse>(`${this.API_URL}/${id}`, request);
  }

  uploadCover(id: number, file: File): Observable<RoomResponse> {
    const formData = new FormData();
    formData.set('file', file);
    return this.http.post<RoomResponse>(`${this.API_URL}/${id}/cover`, formData);
  }

  deleteCover(id: number): Observable<RoomResponse> {
    return this.http.delete<RoomResponse>(`${this.API_URL}/${id}/cover`);
  }

  join(id: number): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/${id}/join`, null);
  }

  leave(id: number): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/${id}/leave`, null);
  }

  /** Добавить трек в очередь комнаты (только хост). */
  addToQueue(roomId: number, trackId: number): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/${roomId}/queue`, null, {
      params: { trackId: trackId.toString() }
    });
  }

  /** Удалить трек из очереди комнаты (только хост). */
  removeFromQueue(roomId: number, queueItemId: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${roomId}/queue/${queueItemId}`);
  }
}
