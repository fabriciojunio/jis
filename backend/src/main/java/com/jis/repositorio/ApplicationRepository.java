package com.jis.repositorio;

import com.jis.modelo.Application;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, Long> {

    Optional<Application> findByJobId(Long jobId);

    boolean existsByJobId(Long jobId);

    List<Application> findByStageOrderByCreatedAtDesc(String stage);

    @Query("SELECT COUNT(a) FROM Application a WHERE a.responseReceived = true")
    Long countResponsesReceived();

    @Query("SELECT COUNT(a) FROM Application a")
    Long countTotalApplications();

}
