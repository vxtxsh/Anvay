package com.cts.mfrp.anvay.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "events")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Event {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "event_id")
    private Long eventId;

    @Column(name = "club_id")
    private Long clubId;

    @NotBlank(message = "Event name is required")
    @Pattern(regexp = "^(?=.*[a-zA-Z]).+$", message = "Event name must contain at least one letter")
    @Column(name = "event_name")
    private String eventName;

    @Column(name = "description")
    private String description;

    @NotBlank(message = "Category is required")
    @Column(name="Category")
    private String category;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    @Column(name = "start_date")
    private LocalDateTime startDate;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    @Column(name = "end_date")
    private LocalDateTime endDate;

    @Pattern(regexp = "^$|^(?=.*[a-zA-Z]).+$", message = "Location must contain at least one letter")
    @Column(name = "location")
    private String location;

    @Column(name="participant_type")
    private String participantType;

    @Min(value = 1, message = "Max participants must be at least 1")
    @Column(name="max_participants")
    private Integer maxParticipants;

    @PositiveOrZero(message = "Registration fee cannot be negative")
    @Column(name="registration_fee")
    private Float registrationFee;

    @Column(name="status")
    private String status;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "club_id", insertable = false, updatable = false)
    @JsonIgnoreProperties("events")
    private Club club;

    @JsonIgnore
    @OneToMany(mappedBy = "event", cascade = CascadeType.ALL)
    private List<EventParticipant> er=new ArrayList<>();

    @Column(name = "winner1_user_id")
    private Long winner1UserId;

    @Column(name = "winner2_user_id")
    private Long winner2UserId;

    @Column(name = "winner3_user_id")
    private Long winner3UserId;

    @Column(name = "winners_status")
    private String winnersStatus;

    @Column(name = "has_winners")
    private Boolean hasWinners;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    @Column(name = "registration_deadline")
    private LocalDateTime registrationDeadline;

    @Column(name = "event_rules")
    private String eventRules;

    @Column(name = "image_data", columnDefinition = "LONGTEXT")
    private String imageData;

    @Pattern(regexp = "^$|^[6-9][0-9]{9}$", message = "Contact number must be a valid 10-digit Indian mobile number starting with 6-9")
    @Column(name = "contact_number")
    private String contactNumber;
}
