package com.cts.mfrp.anvay.controller;

import com.cts.mfrp.anvay.dto.StudentDashboardDTO;
import com.cts.mfrp.anvay.entity.User;
import com.cts.mfrp.anvay.repository.UserRepository;
import com.cts.mfrp.anvay.service.StudentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/students")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class StudentController {

    private final StudentService studentService;
    private final UserRepository userRepository;

    @GetMapping("/{id}/dashboard")
    public ResponseEntity<StudentDashboardDTO> getDashboard(@PathVariable Long id) {
        return ResponseEntity.ok(studentService.getFullDashboard(id));
    }

    @GetMapping("/{id}/profile")
    public ResponseEntity<User> getProfile(@PathVariable Long id) {
        return ResponseEntity.ok(studentService.getStudentById(id));
    }

    @GetMapping("/institution/{institutionId}/leaderboard")
    public ResponseEntity<List<User>> getInstitutionLeaderboard(@PathVariable Long institutionId) {
        return ResponseEntity.ok(userRepository.findStudentsByInstitutionId(institutionId));
    }

    @GetMapping("/leaderboard")
    public ResponseEntity<List<User>> getGlobalLeaderboard() {
        return ResponseEntity.ok(userRepository.findAllStudents());
    }

    @GetMapping
    public ResponseEntity<List<User>> getAllStudents() {
        return ResponseEntity.ok(studentService.getAllStudents());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> removeStudent(@PathVariable Long id) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("Student not found"));
        user.setInstitutionId(null);
        userRepository.save(user);
        return ResponseEntity.noContent().build();
    }
}