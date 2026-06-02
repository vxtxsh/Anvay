package com.cts.mfrp.anvay.controller;

import com.cts.mfrp.anvay.entity.User;
import com.cts.mfrp.anvay.service.StudentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/members")
@RequiredArgsConstructor
public class MemberController {

    private final StudentService studentService;

    @GetMapping
    public ResponseEntity<List<User>> getAllMembers() {
        return ResponseEntity.ok(studentService.getAllStudents());
    }

    @GetMapping("/{memberId}")
    public ResponseEntity<User> getMember(@PathVariable Long memberId) {
        return ResponseEntity.ok(studentService.getStudentById(memberId));
    }

    @PutMapping("/{memberId}")
    public ResponseEntity<User> updateMember(@PathVariable Long memberId, @RequestBody User user) {
        return ResponseEntity.ok(studentService.updateStudent(memberId, user));
    }
}
