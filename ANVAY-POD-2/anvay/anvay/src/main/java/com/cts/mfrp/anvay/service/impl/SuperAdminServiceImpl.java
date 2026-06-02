package com.cts.mfrp.anvay.service.impl;

import com.cts.mfrp.anvay.dto.AnalyticsDto;
import com.cts.mfrp.anvay.dto.DashboardStatsDto;
import com.cts.mfrp.anvay.dto.InstitutionDto;
import com.cts.mfrp.anvay.entity.Institution;
import com.cts.mfrp.anvay.repository.*;
import com.cts.mfrp.anvay.service.SuperAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Month;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SuperAdminServiceImpl implements SuperAdminService {

    private final InstitutionRepository institutionRepository;
    private final UserRepository userRepository;
    private final EventRepository eventRepository;
    private final ClubRepository clubRepository;
    private final EventParticipantRepository eventParticipantRepository;

    @Override
    public DashboardStatsDto getDashboardStats() {
        long totalColleges = institutionRepository.count();
        long activeColleges = institutionRepository.countByStatus("active");
        long pendingColleges = institutionRepository.countByStatus("pending");
        long inactiveColleges = institutionRepository.countByStatus("inactive");
        long totalEvents = eventRepository.count();
        long totalClubs = clubRepository.count();
        long totalStudents = userRepository.countByRole("student") + userRepository.countByRole("club_leader");

        List<Institution> institutions = institutionRepository.findAll();
        List<InstitutionDto> topColleges = institutions.stream()
                .map(this::mapToDto)
                .sorted(Comparator.comparingLong(InstitutionDto::getStudentCount).reversed())
                .limit(5)
                .collect(Collectors.toList());

        Map<String, Long> eventTrends = new LinkedHashMap<>();
        List<Object[]> monthlyData = eventRepository.countEventsByMonth();
        for (Object[] row : monthlyData) {
            int monthNum = ((Number) row[0]).intValue();
            long count = ((Number) row[1]).longValue();
            String monthName = Month.of(monthNum).name().substring(0, 3);
            eventTrends.put(monthName, count);
        }

        return DashboardStatsDto.builder()
                .totalColleges(totalColleges)
                .activeColleges(activeColleges)
                .pendingColleges(pendingColleges)
                .inactiveColleges(inactiveColleges)
                .totalEvents(totalEvents)
                .totalClubs(totalClubs)
                .totalStudents(totalStudents)
                .topColleges(topColleges)
                .eventTrendsByMonth(eventTrends)
                .build();
    }

    @Override
    public List<InstitutionDto> getAllInstitutions(String search) {
        List<Institution> institutions;
        if (search != null && !search.isBlank()) {
            institutions = institutionRepository.searchInstitutions(search);
        } else {
            institutions = institutionRepository.findAll();
        }
        return institutions.stream()
                .map(this::mapToDto)
                .sorted(Comparator.comparing(InstitutionDto::getRegisteredAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    @Override
    public InstitutionDto getInstitutionById(Long institutionId) {
        Institution institution = institutionRepository.findById(institutionId)
                .orElseThrow(() -> new RuntimeException("Institution not found: " + institutionId));
        return mapToDto(institution);
    }

    @Override
    @Transactional
    public InstitutionDto approveInstitution(Long institutionId) {
        Institution institution = institutionRepository.findById(institutionId)
                .orElseThrow(() -> new RuntimeException("Institution not found: " + institutionId));
        institution.setStatus("active");
        return mapToDto(institutionRepository.save(institution));
    }

    @Override
    @Transactional
    public InstitutionDto deactivateInstitution(Long institutionId) {
        Institution institution = institutionRepository.findById(institutionId)
                .orElseThrow(() -> new RuntimeException("Institution not found: " + institutionId));
        institution.setStatus("inactive");
        return mapToDto(institutionRepository.save(institution));
    }

    @Override
    public List<InstitutionDto> getInstitutionLeaderboard() {
        return institutionRepository.findAll().stream()
                .filter(i -> "active".equals(i.getStatus()))
                .map(this::mapToDto)
                .sorted(Comparator.comparingLong(InstitutionDto::getTotalPoints).reversed())
                .collect(Collectors.toList());
    }

    @Override
    public AnalyticsDto getAnalytics() {
        long totalUsers = userRepository.count();
        long totalStudents = userRepository.countByRole("student") + userRepository.countByRole("club_leader");
        long totalInstitutions = institutionRepository.count();
        long totalEvents = eventRepository.count();
        long totalClubs = clubRepository.count();

        List<Institution> institutions = institutionRepository.findAll();
        List<InstitutionDto> rankings = institutions.stream()
                .map(this::mapToDto)
                .sorted(Comparator.comparingLong(InstitutionDto::getTotalPoints).reversed())
                .collect(Collectors.toList());

        return AnalyticsDto.builder()
                .totalUsers(totalUsers)
                .totalStudents(totalStudents)
                .totalInstitutions(totalInstitutions)
                .totalEvents(totalEvents)
                .totalClubs(totalClubs)
                .totalPayments(0L)
                .totalRevenue(0.0)
                .institutionRankings(rankings)
                .build();
    }

    private InstitutionDto mapToDto(Institution institution) {
        long studentCount = userRepository.countStudentsByInstitutionId(institution.getInstitutionId());
        long eventCount = eventRepository.countByInstitutionId(institution.getInstitutionId());
        long clubCount = clubRepository.countByInstitutionId(institution.getInstitutionId());
        Long points = eventParticipantRepository.sumPointsByInstitutionId(institution.getInstitutionId());
        long totalPoints = points != null ? points : 0L;

        return InstitutionDto.builder()
                .institutionId(institution.getInstitutionId())
                .institutionName(institution.getName())
                .email(institution.getInstitutionEmail())
                .phone(null)
                .address(institution.getLocation())
                .status(institution.getStatus())
                .registeredAt(institution.getCreatedAt())
                .studentCount(studentCount)
                .eventCount(eventCount)
                .clubCount(clubCount)
                .totalPoints(totalPoints)
                .build();
    }
}
