package com.jis.repositorio;

import com.jis.modelo.JobScore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface JobScoreRepository extends JpaRepository<JobScore, Long> {

    Optional<JobScore> findByJobId(Long jobId);

    List<JobScore> findByFinalScoreGreaterThanOrderByFinalScoreDesc(Double score);

    List<JobScore> findByNotifiedFalseAndFinalScoreGreaterThanOrderByFinalScoreDesc(Double minScore);

    @Query("SELECT js FROM JobScore js WHERE js.notified = false " +
            "ORDER BY js.finalScore DESC LIMIT :limit")
    List<JobScore> findTopUnnotified(@Param("limit") int limit);

    @Query("SELECT AVG(js.finalScore) FROM JobScore js")
    Double getAverageScore();
}
