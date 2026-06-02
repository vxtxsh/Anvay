package com.cts.mfrp.anvay.dto;

import lombok.*;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class StudentDashboardDTO {
    private String firstName;
    private String institutionName;
    private Integer totalPoints;
    private Integer rank;
    private Integer registeredEventsCount;
    private Integer joinedClubsCount;
    private Integer achievementCount;
    private List<EventRecord> upcomingEvents;
    private List<ClubRecord> joinedClubs;

    // Inside StudentDashboardDTO.java
    private List<AchievementRecord> achievements;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class AchievementRecord {
        private String title;
        private String year;
        private String badgeType;
    }

    @Data @Builder @AllArgsConstructor @NoArgsConstructor
    public static class EventRecord {
        private String title;
        private String institution;
        private String dateTime;
        private String type;
    }

    @Data @Builder @AllArgsConstructor @NoArgsConstructor
    public static class ClubRecord {
        private String name;
        private Integer memberCount;
        private String category;
    }
}