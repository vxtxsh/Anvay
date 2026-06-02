package com.cts.mfrp.anvay.service;

import com.cts.mfrp.anvay.dto.ClubDashboardDTO;
import com.cts.mfrp.anvay.entity.Club;
import com.cts.mfrp.anvay.entity.ClubMember;

import java.util.List;

/**
 * Service interface for Club-related operations.
 * Provides business logic for club management including dashboard data retrieval,
 * club updates, and member management.
 */
public interface ClubService {

    /**
     * Retrieve all clubs for an institution with dashboard information.
     * Includes member counts, join requests, and leadership application counts.
     *
     * @param institutionId the institution ID
     * @return list of ClubDashboardDTO objects containing club information
     * @throws IllegalArgumentException if institution ID is invalid
     */
    List<ClubDashboardDTO> getAllClubsByInstitution(Long institutionId);
    List<Club> getClubs();

    /**
     * Update club details.
     * Allows updating club name and/or category.
     *
     * @param clubId the club ID
     * @param updatedClub the updated club entity with new values
     * @return the updated Club entity
     * @throws IllegalArgumentException if club data is invalid
     */
    Club updateClub(Long clubId, Club updatedClub);

    /**
     * Get all members of a specific club.
     * Returns all members regardless of status.
     *
     * @param clubId the club ID
     * @return list of club members
     * @throws IllegalArgumentException if club ID is invalid
     */
    List<ClubMember> getClubMembers(Long clubId);

    /**
     * Get approved members of a specific club.
     *
     * @param clubId the club ID
     * @return list of approved club members
     */
    List<ClubMember> getApprovedMembers(Long clubId);

    /**
     * Get a club by ID.
     *
     * @param clubId the club ID
     * @return the Club entity
     */
    Club getClubById(Long clubId);

    /**
     * Create a new club.
     *
     * @param club the club entity to create
     * @return the created Club entity
     */
    Club createClub(Club club);

    /**
     * Delete a club by ID.
     *
     * @param clubId the club ID
     */
    void deleteClub(Long clubId);
}
