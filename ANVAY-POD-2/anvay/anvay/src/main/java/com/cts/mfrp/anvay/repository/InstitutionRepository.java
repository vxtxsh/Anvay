package com.cts.mfrp.anvay.repository;

import com.cts.mfrp.anvay.entity.Institution;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InstitutionRepository extends JpaRepository<Institution, Long> {
    long countByStatus(String status);
    List<Institution> findByStatus(String status);

    @Query("SELECT i FROM Institution i WHERE " +
           "(:search IS NULL OR LOWER(i.name) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(i.institutionEmail) LIKE LOWER(CONCAT('%', :search, '%')))")
    List<Institution> searchInstitutions(@Param("search") String search);
}
