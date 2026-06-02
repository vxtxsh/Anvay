package com.cts.mfrp.anvay.controller;

import com.cts.mfrp.anvay.dto.AnalyticsDto;
import com.cts.mfrp.anvay.dto.ClubDashboardDTO;
import com.cts.mfrp.anvay.dto.DashboardStatsDto;
import com.cts.mfrp.anvay.dto.InstitutionDto;
import com.cts.mfrp.anvay.repository.EventRepository;
import com.cts.mfrp.anvay.service.ClubService;
import com.cts.mfrp.anvay.service.SuperAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/super-admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class SuperAdminController {

    private final SuperAdminService superAdminService;
    private final EventRepository eventRepository;
    private final ClubService clubService;

    /**
     * Dashboard: total colleges, events, clubs, student count, event trends
     */
    @GetMapping("/dashboard")
    public ResponseEntity<DashboardStatsDto> getDashboard() {
        return ResponseEntity.ok(superAdminService.getDashboardStats());
    }

    /**
     * College Management: list all institutions with optional search
     */
    @GetMapping("/institutions")
    public ResponseEntity<List<InstitutionDto>> getAllInstitutions(
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(superAdminService.getAllInstitutions(search));
    }

    /**
     * Get single institution details
     */
    @GetMapping("/institutions/{id}")
    public ResponseEntity<InstitutionDto> getInstitution(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(superAdminService.getInstitutionById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/institutions/{id}/events")
    public ResponseEntity<?> getInstitutionEvents(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(eventRepository.findByInstitutionId(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/institutions/{id}/clubs")
    public ResponseEntity<?> getInstitutionClubs(@PathVariable Long id) {
        try {
            List<ClubDashboardDTO> clubs = clubService.getAllClubsByInstitution(id);
            return ResponseEntity.ok(clubs);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * Approve a pending institution registration
     */
    @PutMapping("/institutions/{id}/approve")
    public ResponseEntity<?> approveInstitution(@PathVariable Long id) {
        try {
            InstitutionDto dto = superAdminService.approveInstitution(id);
            return ResponseEntity.ok(dto);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * Deactivate an active institution
     */
    @PutMapping("/institutions/{id}/deactivate")
    public ResponseEntity<?> deactivateInstitution(@PathVariable Long id) {
        try {
            InstitutionDto dto = superAdminService.deactivateInstitution(id);
            return ResponseEntity.ok(dto);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * Analytics: platform-wide stats and institutional rankings
     */
    @GetMapping("/analytics")
    public ResponseEntity<AnalyticsDto> getAnalytics() {
        return ResponseEntity.ok(superAdminService.getAnalytics());
    }
}
