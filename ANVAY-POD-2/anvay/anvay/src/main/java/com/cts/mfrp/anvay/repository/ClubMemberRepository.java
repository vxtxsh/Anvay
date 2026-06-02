package com.cts.mfrp.anvay.repository;

import com.cts.mfrp.anvay.entity.ClubMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClubMemberRepository extends JpaRepository<ClubMember, Long> {
    @Query("SELECT cm FROM ClubMember cm JOIN FETCH cm.user WHERE cm.clubId = :clubId")
    List<ClubMember> findByClubId(@Param("clubId") Long clubId);

    @Query("SELECT cm FROM ClubMember cm JOIN FETCH cm.user WHERE cm.clubId = :clubId AND cm.status = :status")
    List<ClubMember> findByClubIdAndStatus(@Param("clubId") Long clubId, @Param("status") String status);
    List<ClubMember> findByUserId(Long userId);
    Optional<ClubMember> findByClubIdAndUserId(Long clubId, Long userId);
    long countByClubId(Long clubId);
    long countByClubIdAndStatus(Long clubId, String status);
    boolean existsByClubIdAndUserId(Long clubId, Long userId);
}
