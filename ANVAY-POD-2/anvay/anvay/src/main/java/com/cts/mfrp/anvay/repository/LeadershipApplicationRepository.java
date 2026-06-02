package com.cts.mfrp.anvay.repository;

import com.cts.mfrp.anvay.entity.LeadershipApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LeadershipApplicationRepository extends JpaRepository<LeadershipApplication, Long> {
    List<LeadershipApplication> findByUserId(Long userId);
    List<LeadershipApplication> findByStatus(String status);
    long countByClubId(Long clubId);
    long countByClubIdAndStatus(Long clubId, String status);

    @Query("SELECT la FROM LeadershipApplication la JOIN FETCH la.user WHERE la.clubId = :clubId")
    List<LeadershipApplication> findByClubId(@Param("clubId") Long clubId);

    @Query("SELECT la FROM LeadershipApplication la JOIN FETCH la.user WHERE la.clubId = :clubId AND la.status = :status")
    List<LeadershipApplication> findByClubIdAndStatus(@Param("clubId") Long clubId, @Param("status") String status);
}
