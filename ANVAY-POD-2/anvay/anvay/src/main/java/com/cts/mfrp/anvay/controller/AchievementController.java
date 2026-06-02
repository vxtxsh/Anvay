package com.cts.mfrp.anvay.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/achievements")
@RequiredArgsConstructor
public class AchievementController {

    @GetMapping("/{achievementId}")
    public ResponseEntity<Void> getAchievement(@PathVariable Long achievementId) {
        return ResponseEntity.ok().build();
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<Void> getUserAchievements(@PathVariable Long userId) {
        return ResponseEntity.ok().build();
    }
}
