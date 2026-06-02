package com.cts.mfrp.anvay.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InstitutionDto {
    private Long institutionId;
    private String institutionName;
    private String email;
    private String phone;
    private String address;
    private String status;
    private LocalDateTime registeredAt;
    private long studentCount;
    private long eventCount;
    private long clubCount;
    private long totalPoints;
}
