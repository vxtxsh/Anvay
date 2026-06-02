package com.cts.mfrp.anvay.repository;

import com.cts.mfrp.anvay.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    List<User> findByInstitutionId(Long institutionId);
    List<User> findByInstitutionIdAndRole(Long institutionId, String role);
    long countByInstitutionId(Long institutionId);
    long countByInstitutionIdAndRole(Long institutionId, String role);
    List<User> findByRole(String role);
    long countByRole(String role);
    List<User> findByRoleOrderByTotalPointsDesc(String role);

    @Query("SELECT u FROM User u WHERE u.institutionId = :institutionId AND u.role IN ('student', 'club_leader') ORDER BY u.totalPoints DESC NULLS LAST")
    List<User> findStudentsByInstitutionId(@Param("institutionId") Long institutionId);

    @Query("SELECT u FROM User u WHERE u.role IN ('student', 'club_leader') ORDER BY u.totalPoints DESC NULLS LAST")
    List<User> findAllStudents();

    @Query("SELECT COUNT(u) FROM User u WHERE u.institutionId = :institutionId AND u.role IN ('student', 'club_leader')")
    long countStudentsByInstitutionId(@Param("institutionId") Long institutionId);
}
