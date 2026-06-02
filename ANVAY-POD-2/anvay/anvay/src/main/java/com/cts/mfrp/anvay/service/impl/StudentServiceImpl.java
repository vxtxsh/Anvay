package com.cts.mfrp.anvay.service.impl;

import java.util.List;
import java.util.stream.Collectors;

import com.cts.mfrp.anvay.dto.StudentDashboardDTO;
import com.cts.mfrp.anvay.entity.Achievement;
import com.cts.mfrp.anvay.entity.User;
import com.cts.mfrp.anvay.repository.AchievementRepository;
import com.cts.mfrp.anvay.repository.EventRepository;
import com.cts.mfrp.anvay.repository.UserRepository;
import com.cts.mfrp.anvay.service.StudentService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Slf4j
@RequiredArgsConstructor
@Transactional
public class StudentServiceImpl implements StudentService {

    private final UserRepository userRepository;
    private final EventRepository eventRepository;
    private final AchievementRepository achievementRepository;

    @Override
    @Transactional(readOnly = true)
    public User getStudentById(Long studentId) {
        return userRepository.findById(studentId)
                .orElseThrow(() -> new IllegalArgumentException("Student not found"));
    }

    @Override
    @Transactional(readOnly = true)
    public List<User> getAllStudents() {
        return userRepository.findByRole("student");
    }

    @Override
    public User updateStudent(Long studentId, User user) {
        User existing = getStudentById(studentId);
        if (user.getFirstName() != null) existing.setFirstName(user.getFirstName());
        if (user.getEmail() != null) existing.setEmail(user.getEmail());
        return userRepository.save(existing);
    }

    @Override
    @Transactional(readOnly = true)
    public StudentDashboardDTO getFullDashboard(Long studentId) {
        User user = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        List<Achievement> userAchievements = achievementRepository.findByUserId(studentId);

        List<StudentDashboardDTO.EventRecord> upcomingEvents = user.getEventRegistrations()
                .stream()
                .map(registration -> {
                    var event = registration.getEvent();
                    return StudentDashboardDTO.EventRecord.builder()
                            .title(event.getEventName())
                            .institution(event.getClub() != null ? event.getClub().getClubName() : "Unknown Club")
                            .dateTime(event.getStartDate().toString())
                            .type(event.getCategory() != null ? event.getCategory() : "Event")
                            .build();
                })
                .limit(3)
                .collect(Collectors.toList());

        List<User> institutionRanking = userRepository.findStudentsByInstitutionId(user.getInstitutionId());
        int rank = 1;
        for (int i = 0; i < institutionRanking.size(); i++) {
            if (institutionRanking.get(i).getUserId().equals(user.getUserId())) { rank = i + 1; break; }
        }

        return StudentDashboardDTO.builder()
                .firstName(user.getFirstName())
                .institutionName(user.getInstitution() != null ? user.getInstitution().getName() : "")
                .totalPoints(user.getTotalPoints() != null ? user.getTotalPoints() : 0)
                .rank(rank)
                .registeredEventsCount(user.getRegisteredEventsCount() != null ? user.getRegisteredEventsCount() : 0)
                .joinedClubsCount(user.getJoinedClubsCount() != null ? user.getJoinedClubsCount() : 0)
                .achievementCount(userAchievements.size())
                .upcomingEvents(upcomingEvents)
                .joinedClubs(List.of())
                .build();
    }
}
