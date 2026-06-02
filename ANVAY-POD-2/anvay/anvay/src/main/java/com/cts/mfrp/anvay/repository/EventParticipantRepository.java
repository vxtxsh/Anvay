package com.cts.mfrp.anvay.repository;

import com.cts.mfrp.anvay.entity.EventParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EventParticipantRepository extends JpaRepository<EventParticipant, Long> {
    List<EventParticipant> findByEventId(Long eventId);
    List<EventParticipant> findByUserId(Long userId);
    long countByEventId(Long eventId);

    @Query("SELECT ep.userId, SUM(ep.points_earned) FROM EventParticipant ep GROUP BY ep.userId ORDER BY SUM(ep.points_earned) DESC")
    List<Object[]> findUserPointsRanking();

    @Query("SELECT SUM(ep.points_earned) FROM EventParticipant ep JOIN Event e ON ep.eventId = e.eventId JOIN Club c ON e.clubId = c.clubId WHERE c.institutionId = :institutionId")
    Long sumPointsByInstitutionId(@Param("institutionId") Long institutionId);

    @Query("SELECT ep FROM EventParticipant ep JOIN FETCH ep.user WHERE ep.eventId = :eventId")
    List<EventParticipant> findByEventIdWithUser(@Param("eventId") Long eventId);

    java.util.Optional<EventParticipant> findByEventIdAndUserId(Long eventId, Long userId);

    @Query("SELECT ep FROM EventParticipant ep JOIN FETCH ep.event WHERE ep.userId = :userId")
    List<EventParticipant> findByUserIdWithEvent(@Param("userId") Long userId);
}
