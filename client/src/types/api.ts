
import type { AwarenessSession, Attendee, ChildScreening, ScreenedChild, Blog, User } from '@shared/schema';

export interface AwarenessSessionsResponse {
  sessions: AwarenessSession[];
  attendees: Record<number, Attendee[]>;
  users: User[];
}

export interface ChildScreeningsResponse {
  screenings: ChildScreening[];
  children: Record<number, ScreenedChild[]>;
  users: User[];
}

export interface BlogsResponse {
  blogs: Blog[];
}

export interface UsersResponse {
  users: User[];
}

export interface ExportDataResponse {
  awarenessSessions: AwarenessSession[];
  childScreenings: ChildScreening[];
}
