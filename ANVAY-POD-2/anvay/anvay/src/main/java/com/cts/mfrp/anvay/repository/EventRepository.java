package com.cts.mfrp.anvay.repository;

import com.cts.mfrp.anvay.entity.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {
    List<Event> findByClubId(Long clubId);
    List<Event> findByStatusNot(String status);

    @Query("SELECT e, (CASE WHEN p.id IS NOT NULL THEN true ELSE false END) " +
           "FROM Event e LEFT JOIN EventParticipant p ON e.eventId = p.eventId AND p.userId = :userId")
    List<Object[]> findAllEventsWithRegistrationStatus(@Param("userId") Long userId);

    @Query("SELECT e, (CASE WHEN p.id IS NOT NULL THEN true ELSE false END) " +
           "FROM Event e JOIN Club c ON e.clubId = c.clubId " +
           "LEFT JOIN EventParticipant p ON e.eventId = p.eventId AND p.userId = :userId " +
           "WHERE c.institutionId = :institutionId OR e.participantType = 'all'")
    List<Object[]> findEventsForStudent(@Param("userId") Long userId, @Param("institutionId") Long institutionId);

    @Query("SELECT COUNT(e) FROM Event e JOIN Club c ON e.clubId = c.clubId WHERE c.institutionId = :institutionId")
    long countByInstitutionId(@Param("institutionId") Long institutionId);

    @Query("SELECT e FROM Event e JOIN Club c ON e.clubId = c.clubId WHERE c.institutionId = :institutionId")
    List<Event> findByInstitutionId(@Param("institutionId") Long institutionId);

    @Query("SELECT e FROM Event e JOIN FETCH e.club cl JOIN FETCH cl.institution WHERE e.winnersStatus = :status")
    List<Event> findByWinnersStatus(@Param("status") String status);

    @Query("SELECT MONTH(e.startDate), COUNT(e) FROM Event e WHERE e.startDate IS NOT NULL GROUP BY MONTH(e.startDate) ORDER BY MONTH(e.startDate)")
    List<Object[]> countEventsByMonth();
}
