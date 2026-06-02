package com.cts.mfrp.anvay.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class WinnersApprovalDTO {
    private Long eventId;
    private String eventName;
    private String institutionName;
    private Long winner1UserId;
    private String winner1Name;
    private Long winner2UserId;
    private String winner2Name;
    private Long winner3UserId;
    private String winner3Name;
}
