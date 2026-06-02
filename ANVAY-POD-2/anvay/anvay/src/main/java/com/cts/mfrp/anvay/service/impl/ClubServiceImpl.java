package com.cts.mfrp.anvay.service.impl;

import com.cts.mfrp.anvay.dto.ClubDashboardDTO;
import com.cts.mfrp.anvay.entity.Club;
import com.cts.mfrp.anvay.entity.ClubMember;
import com.cts.mfrp.anvay.repository.ClubRepository;
import com.cts.mfrp.anvay.repository.ClubMemberRepository;
import com.cts.mfrp.anvay.repository.LeadershipApplicationRepository;
import com.cts.mfrp.anvay.service.ClubService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Implementation of ClubService interface.
 * Handles business logic for club management operations including dashboard data,
 * updates, and member management.
 */
@Service
@Slf4j
@RequiredArgsConstructor
@Transactional
public class ClubServiceImpl implements ClubService {

    private final ClubRepository clubRepository;
    private final ClubMemberRepository clubMemberRepository;
    private final LeadershipApplicationRepository leadershipApplicationRepository;

    /**
     * Retrieve all clubs for an institution with dashboard information.
     * Efficiently builds dashboard data by fetching clubs and calculating counts.
     *
     * @param institutionId the institution ID
     * @return list of ClubDashboardDTO objects containing club information
     */

    @Override
    @Transactional(readOnly = true)
    public List<Club> getClubs(){
        return clubRepository.findAll();
    }
    @Override
    @Transactional(readOnly = true)
    public List<ClubDashboardDTO> getAllClubsByInstitution(Long institutionId) {
        log.info("Fetching all clubs for institution ID: {}", institutionId);

        // Fetch all clubs for the institution
        List<Club> clubs = clubRepository.findByInstitutionId(institutionId);

        // Build dashboard DTOs with counts
        return clubs.stream()
                .map(this::buildClubDashboardDTO)
                .collect(Collectors.toList());
    }

    /**
     * Update club details.
     * Updates the club name and/or category.
     *
     * @param clubId the club ID
     * @param updatedClub the updated club entity with new values
     * @return the updated Club entity
     */
    @Override
    public Club updateClub(Long clubId, Club updatedClub) {
        log.info("Updating club with ID: {}", clubId);

        Club club = clubRepository.findById(clubId)
                .orElseThrow(() -> {
                    log.error("Club not found with ID: {}", clubId);
                    return new IllegalArgumentException("Club not found with ID: " + clubId);
                });

        // Update only provided fields
        if (updatedClub.getClubName() != null && !updatedClub.getClubName().isBlank()) {
            club.setClubName(updatedClub.getClubName());
        }

        if (updatedClub.getCategory() != null && !updatedClub.getCategory().isBlank()) {
            club.setCategory(updatedClub.getCategory());
        }

        // Update member count if provided
        if (updatedClub.getMemberCount() != null) {
            club.setMemberCount(updatedClub.getMemberCount());
        }

        club.setUpdatedAt(LocalDateTime.now());

        Club savedClub = clubRepository.save(club);
        log.info("Club updated successfully with ID: {}", clubId);

        return savedClub;
    }

    /**
     * Get all members of a specific club.
     *
     * @param clubId the club ID
     * @return list of club members
     */
    @Override
    @Transactional(readOnly = true)
    public List<ClubMember> getClubMembers(Long clubId) {
        log.info("Fetching all members for club ID: {}", clubId);

        // Verify club exists
        clubRepository.findById(clubId)
                .orElseThrow(() -> {
                    log.error("Club not found with ID: {}", clubId);
                    return new IllegalArgumentException("Club not found with ID: " + clubId);
                });

        return clubMemberRepository.findByClubId(clubId);
    }

    /**
     * Get approved members of a specific club.
     *
     * @param clubId the club ID
     * @return list of approved club members
     */
    @Override
    @Transactional(readOnly = true)
    public List<ClubMember> getApprovedMembers(Long clubId) {
        log.info("Fetching approved members for club ID: {}", clubId);

        return clubMemberRepository.findByClubIdAndStatus(clubId, "APPROVED");
    }

    /**
     * Get a club by ID.
     *
     * @param clubId the club ID
     * @return the Club entity
     */
    @Override
    @Transactional(readOnly = true)
    public Club getClubById(Long clubId) {
        log.info("Fetching club with ID: {}", clubId);

        return clubRepository.findById(clubId)
                .orElseThrow(() -> {
                    log.error("Club not found with ID: {}", clubId);
                    return new IllegalArgumentException("Club not found with ID: " + clubId);
                });
    }

    /**
     * Create a new club.
     *
     * @param club the club entity to create
     * @return the created Club entity
     */
    @Override
    public Club createClub(Club club) {
        log.info("Creating new club with name: {}", club.getClubName());

        club.setCreatedAt(LocalDateTime.now());
        club.setUpdatedAt(LocalDateTime.now());
        club.setMemberCount(0); // Initialize member count to 0

        Club savedClub = clubRepository.save(club);
        log.info("Club created successfully with ID: {}", savedClub.getClubId());

        return savedClub;
    }

    /**
     * Delete a club by ID.
     *
     * @param clubId the club ID
     */
    @Override
    public void deleteClub(Long clubId) {
        log.info("Deleting club with ID: {}", clubId);

        Club club = clubRepository.findById(clubId)
                .orElseThrow(() -> {
                    log.error("Club not found with ID: {}", clubId);
                    return new IllegalArgumentException("Club not found with ID: " + clubId);
                });

        clubRepository.delete(club);
        log.info("Club deleted successfully with ID: {}", clubId);
    }

    /**
     * Build a ClubDashboardDTO from a Club entity.
     * Calculates all required counts for the dashboard.
     *
     * @param club the Club entity
     * @return ClubDashboardDTO with all required information
     */
    private ClubDashboardDTO buildClubDashboardDTO(Club club) {
        long membersCount = clubMemberRepository.countByClubIdAndStatus(club.getClubId(), "APPROVED");
        long joinRequestsCount = clubMemberRepository.countByClubIdAndStatus(club.getClubId(), "PENDING");
        long leadershipAppsCount = leadershipApplicationRepository.countByClubIdAndStatus(club.getClubId(), "pending");

        return ClubDashboardDTO.builder()
                .clubId(club.getClubId())
                .clubName(club.getClubName())
                .type(club.getCategory())
                .membersCount(membersCount)
                .joinRequestsCount(joinRequestsCount)
                .leadershipAppsCount(leadershipAppsCount)
                .createdDate(club.getCreatedAt())
                .build();
    }
}
