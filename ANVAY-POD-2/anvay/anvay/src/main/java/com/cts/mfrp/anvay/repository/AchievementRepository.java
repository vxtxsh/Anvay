package com.cts.mfrp.anvay.repository;

import com.cts.mfrp.anvay.entity.Achievement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AchievementRepository extends JpaRepository<Achievement, Long> {
    List<Achievement> findByUserId(Long userId);

    @Query("SELECT SUM(a.points) FROM Achievement a WHERE a.userId = :userId")
    Integer sumPointsByUserId(@Param("userId") Long userId);
}
