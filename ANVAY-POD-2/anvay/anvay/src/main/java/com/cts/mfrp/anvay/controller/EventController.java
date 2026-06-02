package com.cts.mfrp.anvay.controller;

import com.cts.mfrp.anvay.dto.EventFeedDTO;
import com.cts.mfrp.anvay.dto.WinnersApprovalDTO;
import com.cts.mfrp.anvay.entity.Event;
import com.cts.mfrp.anvay.entity.EventParticipant;
import com.cts.mfrp.anvay.repository.EventParticipantRepository;
import com.cts.mfrp.anvay.service.EventService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class EventController {

    private final EventService eventService;

    @GetMapping("/")
    public ResponseEntity<List<Event>> getEvents(){
        return ResponseEntity.ok(eventService.getEvents());
    }

    @GetMapping("/{eventId}")
    public ResponseEntity<Event> getEvent(@PathVariable Long eventId) {
        return ResponseEntity.ok(eventService.getEventById(eventId));
    }

    @GetMapping("/club/{clubId}")
    public ResponseEntity<List<Event>> getEventsByClub(@PathVariable Long clubId) {
        return ResponseEntity.ok(eventService.getEventsByClubId(clubId));
    }

    @GetMapping("/institution/{institutionId}")
    public ResponseEntity<List<Event>> getEventsByInstitution(@PathVariable Long institutionId) {
        return ResponseEntity.ok(eventService.getEventsByInstitutionId(institutionId));
    }

    @PostMapping
    public ResponseEntity<Event> createEvent(@Valid @RequestBody Event event) {
        return ResponseEntity.status(HttpStatus.CREATED).body(eventService.createEvent(event));
    }

    @PutMapping("/{eventId}")
    public ResponseEntity<Event> updateEvent(@PathVariable Long eventId, @Valid @RequestBody Event event) {
        return ResponseEntity.ok(eventService.updateEvent(eventId, event));
    }

    @DeleteMapping("/{eventId}")
    public ResponseEntity<Void> deleteEvent(@PathVariable Long eventId) {
        eventService.deleteEvent(eventId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/all")
    public ResponseEntity<List<EventFeedDTO>> getAllEvents(@RequestParam(required = false) Long userId) {
        return ResponseEntity.ok(eventService.getAllEventsWithStatus(userId));
    }

    @GetMapping("/feed")
    public ResponseEntity<List<EventFeedDTO>> getEventsForStudent(
            @RequestParam Long userId,
            @RequestParam Long institutionId) {
        return ResponseEntity.ok(eventService.getEventsForStudent(userId, institutionId));
    }

    @Autowired
    private EventParticipantRepository participantRepository;

    @PostMapping("/register")
    public ResponseEntity<EventParticipant> registerParticipant(@RequestBody EventParticipant participant) {
        EventParticipant savedParticipant = eventService.registerParticipant(participant);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedParticipant);
    }

    @GetMapping("/{eventId}/participants")
    public ResponseEntity<List<EventParticipant>> getParticipants(@PathVariable Long eventId) {
        return ResponseEntity.ok(eventService.getEventParticipants(eventId));
    }

    @PostMapping("/{eventId}/award-winners")
    public ResponseEntity<?> submitWinners(@PathVariable Long eventId, @RequestBody java.util.Map<String, Long> body) {
        eventService.submitWinners(eventId, body.get("firstUserId"), body.get("secondUserId"), body.get("thirdUserId"));
        return ResponseEntity.ok(java.util.Map.of("message", "Winners submitted for approval"));
    }

    @PostMapping("/{eventId}/approve-winners")
    public ResponseEntity<?> approveWinners(@PathVariable Long eventId) {
        eventService.approveWinners(eventId);
        return ResponseEntity.ok(java.util.Map.of("message", "Winners approved and points awarded"));
    }

    @GetMapping("/pending-winners")
    public ResponseEntity<List<WinnersApprovalDTO>> getPendingWinners() {
        return ResponseEntity.ok(eventService.getPendingWinners());
    }

    @PutMapping("/{eventId}/end")
    public ResponseEntity<?> endEvent(@PathVariable Long eventId) {
        eventService.endEvent(eventId);
        return ResponseEntity.ok(java.util.Map.of("message", "Event ended successfully"));
    }

    @GetMapping("/my-registrations")
    public ResponseEntity<List<EventFeedDTO>> getMyRegistrations(@RequestParam Long userId) {
        return ResponseEntity.ok(eventService.getMyRegistrations(userId));
    }

}
