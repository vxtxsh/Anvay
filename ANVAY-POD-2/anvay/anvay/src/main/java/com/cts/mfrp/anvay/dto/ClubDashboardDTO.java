package com.cts.mfrp.anvay.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClubDashboardDTO {
    private Long clubId;
    private String clubName;
    private String type;
    private long membersCount;
    private long joinRequestsCount;
    private long leadershipAppsCount;
    private LocalDateTime createdDate;
}
