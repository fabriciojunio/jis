package com.jis.repositorio;

import com.jis.modelo.Job;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface JobRepository extends JpaRepository<Job, Long> {

    boolean existsByExternalId(String externalId);

    Optional<Job> findByExternalId(String externalId);

    List<Job> findByActiveTrue();

    List<Job> findByCreatedAtAfter(LocalDateTime dateTime);

    @Query("SELECT j FROM Job j WHERE j.active = true ORDER BY j.createdAt DESC")
    List<Job> findAllActiveOrderedByDate();

    @Query("SELECT j FROM Job j WHERE j.createdAt >= :since AND j.active = true")
    List<Job> findRecentJobs(@Param("since") LocalDateTime since);

    @Query("SELECT COUNT(j) FROM Job j WHERE DATE(j.createdAt) = CURRENT_DATE")
    Long countTodayJobs();

    @Query(value = "SELECT * FROM jobs j WHERE j.active = true " +
            "AND NOT EXISTS (SELECT 1 FROM job_scores s WHERE s.job_id = j.id) " +
            "ORDER BY j.created_at DESC",
            nativeQuery = true)
    List<Job> findJobsWithoutScore();
}
