package com.cts.mfrp.anvay.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "institution_id")
    private Long institutionId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "institution_id", insertable = false, updatable = false)
    @JsonIgnoreProperties({"users", "club"})
    private Institution institution;

    @Column(name = "email", unique = true)
    private String email;

    @Column(name = "first_name")
    private String firstName;

    @Column(name = "last_name")
    private String lastName;

    @Column(name = "password")
    private String password;

    @Column(name = "role")
    private String role;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Builder.Default
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    @JsonIgnoreProperties("user")
    private List<EventParticipant> eventRegistrations = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    @JsonIgnoreProperties("user")
    private List<ClubMember> clubMembers = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    @JsonIgnoreProperties("user")
    private List<Achievement> achievements = new ArrayList<>();

    @Column(name = "total_points")
    private Integer totalPoints;

    @Column(name = "rank_in_leaderboard")
    private Integer rankInLeaderboard;

    @Column(name = "registered_events_count")
    private Integer registeredEventsCount;

    @Column(name = "joined_clubs_count")
    private Integer joinedClubsCount;

    @Column(name = "leading_club_id")
    private Long leadingClubId;

    @Column(name = "student_id_number")
    private String studentIdNumber;

    @Column(name = "profile_picture", columnDefinition = "LONGTEXT")
    private String profilePicture;
}
