import { TrackResponse } from './track.model';

export interface PlaylistResponse {
  id: number;
  name: string;
  description?: string;
  ownerId: number;
  ownerUsername: string;
  tracks?: TrackResponse[];
  trackCount: number;
}
