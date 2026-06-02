import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EventRecord, EventParticipant } from '../models/event.model';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  // Use inject() for a cleaner, modern Angular approach
  private http = inject(HttpClient);
  
  // This matches your @RequestMapping("/api/events") in Spring Boot
  private apiUrl = 'http://localhost:8081/api/events';

  // Fetches all records from your EventController's @GetMapping("/all")
  getAllEvents(userId: number): Observable<EventRecord[]> {
    return this.http.get<EventRecord[]>(`${this.apiUrl}/all?userId=${userId}`);
  }

  // event.service.ts
registerForEvent(eventId: number, userId: number): Observable<EventParticipant> {
  const payload = {
    eventId: eventId,
    userId: userId,
    status: 'REGISTERED' // This matches your backend entity requirement
  };
  return this.http.post<EventParticipant>(`${this.apiUrl}/register`, payload);
}
}