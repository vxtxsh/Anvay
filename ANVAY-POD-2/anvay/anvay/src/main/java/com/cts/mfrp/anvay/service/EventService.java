package com.cts.mfrp.anvay.service;

import java.util.List;

import com.cts.mfrp.anvay.dto.EventFeedDTO;
import com.cts.mfrp.anvay.dto.WinnersApprovalDTO;
import com.cts.mfrp.anvay.entity.Event;
import com.cts.mfrp.anvay.entity.EventParticipant;

public interface EventService {
    List<Event> getEvents();
    Event createEvent(Event event);
    Event getEventById(Long eventId);
    List<Event> getEventsByClubId(Long clubId);
    List<Event> getEventsByInstitutionId(Long institutionId);
    Event updateEvent(Long eventId, Event event);
    void deleteEvent(Long eventId);
    EventParticipant registerParticipant(EventParticipant participant);
    List<EventFeedDTO> getAllEventsWithStatus(Long userId);
    List<EventFeedDTO> getEventsForStudent(Long userId, Long institutionId);
    void submitWinners(Long eventId, Long firstUserId, Long secondUserId, Long thirdUserId);
    void approveWinners(Long eventId);
    List<WinnersApprovalDTO> getPendingWinners();
    List<EventParticipant> getEventParticipants(Long eventId);
    void endEvent(Long eventId);
    List<EventFeedDTO> getMyRegistrations(Long userId);
}
