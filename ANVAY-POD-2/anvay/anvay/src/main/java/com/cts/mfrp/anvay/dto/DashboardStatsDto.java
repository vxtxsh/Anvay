package com.cts.mfrp.anvay.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsDto {
    private long totalColleges;
    private long activeColleges;
    private long pendingColleges;
    private long inactiveColleges;
    private long totalEvents;
    private long totalClubs;
    private long totalStudents;
    private List<InstitutionDto> topColleges;
    private Map<String, Long> eventTrendsByMonth; // "Jan" -> count
}
