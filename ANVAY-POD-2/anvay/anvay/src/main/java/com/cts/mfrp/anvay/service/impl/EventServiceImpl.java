package com.cts.mfrp.anvay.service.impl;

import com.cts.mfrp.anvay.dto.EventFeedDTO;
import com.cts.mfrp.anvay.dto.WinnersApprovalDTO;
import com.cts.mfrp.anvay.entity.Event;
import com.cts.mfrp.anvay.entity.EventParticipant;
import com.cts.mfrp.anvay.entity.User;
import com.cts.mfrp.anvay.repository.EventParticipantRepository;
import com.cts.mfrp.anvay.repository.EventRepository;
import com.cts.mfrp.anvay.repository.UserRepository;
import com.cts.mfrp.anvay.service.EventService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
@Transactional
public class EventServiceImpl implements EventService {

    private final EventRepository eventRepository;

    @Override
    public Event createEvent(Event event) {
        log.info("Creating new event: {}", event.getEventName());
        event.setCreatedAt(LocalDateTime.now());
        event.setUpdatedAt(LocalDateTime.now());
        return eventRepository.save(event);
    }


    @Override
    @Transactional(readOnly = true)
    public List<Event> getEvents(){
        return eventRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public Event getEventById(Long eventId) {
        return eventRepository.findById(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Event not found"));
    }

    @Override
    @Transactional(readOnly = true)
    public List<Event> getEventsByClubId(Long clubId) {
        return eventRepository.findByClubId(clubId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Event> getEventsByInstitutionId(Long institutionId) {
        return eventRepository.findByInstitutionId(institutionId);
    }

    @Override
    public Event updateEvent(Long eventId, Event event) {
        Event existing = getEventById(eventId);
        if (event.getEventName() != null) existing.setEventName(event.getEventName());
        if (event.getDescription() != null) existing.setDescription(event.getDescription());
        if (event.getStartDate() != null) existing.setStartDate(event.getStartDate());
        if (event.getEndDate() != null) existing.setEndDate(event.getEndDate());
        if (event.getLocation() != null) existing.setLocation(event.getLocation());
        if (event.getCategory() != null) existing.setCategory(event.getCategory());
        if (event.getStatus() != null) existing.setStatus(event.getStatus());
        if (event.getParticipantType() != null) existing.setParticipantType(event.getParticipantType());
        if (event.getMaxParticipants() != null) existing.setMaxParticipants(event.getMaxParticipants());
        if (event.getRegistrationFee() != null) existing.setRegistrationFee(event.getRegistrationFee());
        if (event.getHasWinners() != null) existing.setHasWinners(event.getHasWinners());
        if (event.getRegistrationDeadline() != null) existing.setRegistrationDeadline(event.getRegistrationDeadline());
        if (event.getEventRules() != null) existing.setEventRules(event.getEventRules());
        existing.setUpdatedAt(LocalDateTime.now());
        return eventRepository.save(existing);
    }

    @Override
    public void deleteEvent(Long eventId) {

        eventRepository.deleteById(eventId);
    }

    // Inside EventServiceImpl.java
    private final EventParticipantRepository participantRepository; // Add this to constructor
    private final UserRepository userRepository;

    @Override
    public EventParticipant registerParticipant(EventParticipant participant) {
        log.info("Registering user {} for event {}", participant.getUserId(), participant.getEventId());

        // 1. Save the registration record
        participant.setCreatedAt(LocalDateTime.now());
        participant.setStatus("REGISTERED");
        EventParticipant savedParticipant = participantRepository.save(participant);

        // 2. Update User table (registered_events_count)
        User user = userRepository.findById(participant.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        int currentEventCount = user.getRegisteredEventsCount() != null ? user.getRegisteredEventsCount() : 0;
        user.setRegisteredEventsCount(currentEventCount + 1);
        userRepository.save(user);

        // 3. Update Event table (registered_count)
        Event event = eventRepository.findById(participant.getEventId())
                .orElseThrow(() -> new IllegalArgumentException("Event not found"));

//        int currentRegCount = event.getEr() != null ? event.getEr().size() : 0;
//        event.setRegisteredCount(currentRegCount + 1);
//        eventRepository.save(event);

        return savedParticipant;
    }

    @Override
    public List<EventFeedDTO> getAllEventsWithStatus(Long userId) {
        List<Object[]> results = eventRepository.findAllEventsWithRegistrationStatus(userId);
        return mapToFeedDTOs(results);
    }

    @Override
    public List<EventFeedDTO> getEventsForStudent(Long userId, Long institutionId) {
        List<Object[]> results = eventRepository.findEventsForStudent(userId, institutionId);
        return mapToFeedDTOs(results);
    }

    @Override
    public List<EventParticipant> getEventParticipants(Long eventId) {
        return participantRepository.findByEventIdWithUser(eventId);
    }

    @Override
    public void submitWinners(Long eventId, Long firstUserId, Long secondUserId, Long thirdUserId) {
        Event event = getEventById(eventId);
        if ("pending".equals(event.getWinnersStatus()) || "approved".equals(event.getWinnersStatus())) {
            throw new IllegalStateException("Winners already submitted for this event");
        }
        event.setWinner1UserId(firstUserId);
        event.setWinner2UserId(secondUserId);
        event.setWinner3UserId(thirdUserId);
        event.setWinnersStatus("pending");
        eventRepository.save(event);
    }

    @Override
    public void approveWinners(Long eventId) {
        Event event = getEventById(eventId);
        if (!"pending".equals(event.getWinnersStatus())) {
            throw new IllegalStateException("No pending winners for this event");
        }
        awardPoints(eventId, event.getWinner1UserId(), 100);
        awardPoints(eventId, event.getWinner2UserId(), 75);
        awardPoints(eventId, event.getWinner3UserId(), 50);
        event.setWinnersStatus("approved");
        eventRepository.save(event);
    }

    @Override
    public List<WinnersApprovalDTO> getPendingWinners() {
        List<Event> pending = eventRepository.findByWinnersStatus("pending");
        return pending.stream().map(event -> {
            String institutionName = event.getClub() != null && event.getClub().getInstitution() != null
                    ? event.getClub().getInstitution().getName() : "Unknown";
            return WinnersApprovalDTO.builder()
                    .eventId(event.getEventId())
                    .eventName(event.getEventName())
                    .institutionName(institutionName)
                    .winner1UserId(event.getWinner1UserId())
                    .winner1Name(resolveUserName(event.getWinner1UserId()))
                    .winner2UserId(event.getWinner2UserId())
                    .winner2Name(resolveUserName(event.getWinner2UserId()))
                    .winner3UserId(event.getWinner3UserId())
                    .winner3Name(resolveUserName(event.getWinner3UserId()))
                    .build();
        }).collect(Collectors.toList());
    }

    private String resolveUserName(Long userId) {
        if (userId == null) return null;
        return userRepository.findById(userId)
                .map(u -> u.getFirstName() + " " + u.getLastName())
                .orElse("Unknown");
    }

    private void awardPoints(Long eventId, Long userId, int points) {
        if (userId == null) return;
        User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setTotalPoints((user.getTotalPoints() != null ? user.getTotalPoints() : 0) + points);
        userRepository.save(user);
        participantRepository.findByEventIdAndUserId(eventId, userId).ifPresent(ep -> {
            ep.setPoints_earned(points);
            participantRepository.save(ep);
        });
    }

    @Override
    public void endEvent(Long eventId) {
        Event event = getEventById(eventId);
        event.setStatus("ended");
        event.setUpdatedAt(LocalDateTime.now());
        eventRepository.save(event);
    }

    @Override
    public List<EventFeedDTO> getMyRegistrations(Long userId) {
        List<EventParticipant> participants = participantRepository.findByUserIdWithEvent(userId);
        return participants.stream().map(ep -> {
            Event event = ep.getEvent();
            String institutionName = "General";
            Long institutionId = null;
            try {
                if (event.getClub() != null) {
                    institutionId = event.getClub().getInstitutionId();
                    if (event.getClub().getInstitution() != null) {
                        institutionName = event.getClub().getInstitution().getName();
                    }
                }
            } catch (Exception ignored) {}
            return EventFeedDTO.builder()
                    .eventId(event.getEventId())
                    .title(event.getEventName())
                    .institution(institutionName)
                    .institutionId(institutionId)
                    .location(event.getLocation())
                    .type(event.getCategory())
                    .participantType(event.getParticipantType())
                    .registeredCount(event.getEr() != null ? event.getEr().size() : 0)
                    .totalCapacity(event.getMaxParticipants())
                    .isRegistered(true)
                    .startDate(event.getStartDate() != null ? event.getStartDate().toString() : null)
                    .endDate(event.getEndDate() != null ? event.getEndDate().toString() : null)
                    .status(event.getStatus())
                    .hasWinners(event.getHasWinners())
                    .imageData(event.getImageData())
                    .registrationDeadline(event.getRegistrationDeadline() != null ? event.getRegistrationDeadline().toString() : null)
                    .build();
        }).collect(Collectors.toList());
    }

    private List<EventFeedDTO> mapToFeedDTOs(List<Object[]> results) {
        return results.stream().map(result -> {
            Event event = (Event) result[0];
            Boolean isRegistered = (Boolean) result[1];
            String institutionName = event.getClub() != null && event.getClub().getInstitution() != null
                    ? event.getClub().getInstitution().getName() : "General";
            Long institutionId = event.getClub() != null ? event.getClub().getInstitutionId() : null;
            return EventFeedDTO.builder()
                    .eventId(event.getEventId())
                    .title(event.getEventName())
                    .institution(institutionName)
                    .institutionId(institutionId)
                    .location(event.getLocation())
                    .type(event.getCategory())
                    .participantType(event.getParticipantType())
                    .registeredCount(event.getEr() != null ? event.getEr().size() : 0)
                    .totalCapacity(event.getMaxParticipants())
                    .isRegistered(isRegistered)
                    .startDate(event.getStartDate() != null ? event.getStartDate().toString() : null)
                    .endDate(event.getEndDate() != null ? event.getEndDate().toString() : null)
                    .status(event.getStatus())
                    .hasWinners(event.getHasWinners())
                    .imageData(event.getImageData())
                    .registrationDeadline(event.getRegistrationDeadline() != null ? event.getRegistrationDeadline().toString() : null)
                    .build();
        }).collect(Collectors.toList());
    }
}
