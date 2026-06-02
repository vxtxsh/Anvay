package com.cts.mfrp.anvay.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {
    private String token;
    private String role;
    private String name;
    private Long userId;
    private Long institutionId;
    private Long leadingClubId;
}
