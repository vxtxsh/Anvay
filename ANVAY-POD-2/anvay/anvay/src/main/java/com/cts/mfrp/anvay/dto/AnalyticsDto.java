package com.cts.mfrp.anvay.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsDto {
    private long totalUsers;
    private long totalStudents;
    private long totalInstitutions;
    private long totalEvents;
    private long totalClubs;
    private long totalPayments;
    private double totalRevenue;
    private List<InstitutionDto> institutionRankings; // sorted by points desc
}
