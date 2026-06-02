package com.cts.mfrp.anvay.service;

import java.util.List;
import com.cts.mfrp.anvay.entity.User;
import com.cts.mfrp.anvay.dto.StudentDashboardDTO; // Import the DTO

public interface StudentService {
    // Existing methods
    User getStudentById(Long studentId);
    List<User> getAllStudents();
    User updateStudent(Long studentId, User user);

    /**
     * Fetches the aggregated data for the student dashboard
     * @param studentId The ID of the student
     * @return A DTO containing stats, upcoming events, and joined clubs
     */
    StudentDashboardDTO getFullDashboard(Long studentId);
}