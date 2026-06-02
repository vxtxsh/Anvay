import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventService } from '../.../../services/event.service'; // Adjust path based on your folder structure
import { EventRecord } from '../.../../models/event.model';

@Component({
  selector: 'app-event-feed',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './event-feed.component.html',
  styleUrls: ['./event-feed.component.css']
})
export class EventFeedComponent implements OnInit {
  // Initialize as an empty array to be populated by the service
  events: EventRecord[] = [];
  private eventService = inject(EventService);

  ngOnInit(): void {
    this.loadEvents();
  }

  loadEvents(): void {
  // Hardcoded 101 for now to match your database test user
  this.eventService.getAllEvents(101).subscribe({
    next: (data) => {
      this.events = data; 
      // Because 'isRegistered' is now true in the JSON, 
      // the [ngClass] logic in your HTML will automatically turn the button green.
    }
  });
}

  calculateProgress(registered: number, total: number): number {
    if (!total || total === 0) return 0; // Prevent division by zero
    return (registered / total) * 100;
  }

  showModal = false;
  selectedEvent: EventRecord | null = null;
  isSubmitting = false;

  openRegistrationModal(event: EventRecord) {
    this.selectedEvent = event;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.selectedEvent = null;
  }

  confirmRegistration() {
  // Ensure eventId is not undefined before proceeding
  if (this.selectedEvent && this.selectedEvent.eventId !== undefined) {
    this.isSubmitting = true;
    
    this.eventService.registerForEvent(this.selectedEvent.eventId, 101).subscribe({
      next: (response) => {
        // Update local state to turn button green
        const eventInList = this.events.find(e => e.eventId === this.selectedEvent?.eventId);
        if (eventInList) eventInList.isRegistered = true;
        
        this.isSubmitting = false;
        this.showModal = false;
      },
      error: (err) => {
        this.isSubmitting = false;
        alert("Registration failed");
      }
    });
  } else {
    console.error("Cannot register: Event ID is missing.");
  }
}
}