package com.cts.mfrp.anvay.scheduler;

import com.cts.mfrp.anvay.entity.Event;
import com.cts.mfrp.anvay.repository.EventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class EventScheduler {

    private final EventRepository eventRepository;

    // Runs every 5 minutes; marks events as "ended" once their endDate has passed
    @Scheduled(fixedRate = 300_000)
    @Transactional
    public void autoEndExpiredEvents() {
        LocalDateTime now = LocalDateTime.now();
        List<Event> nonEndedEvents = eventRepository.findByStatusNot("ended");
        long count = 0;
        for (Event event : nonEndedEvents) {
            if (event.getEndDate() != null && event.getEndDate().isBefore(now)) {
                event.setStatus("ended");
                event.setUpdatedAt(now);
                eventRepository.save(event);
                count++;
            }
        }
        if (count > 0) {
            log.info("Auto-ended {} expired event(s)", count);
        }
    }
}
