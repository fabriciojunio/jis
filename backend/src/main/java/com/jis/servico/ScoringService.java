package com.jis.servico;

import com.jis.transferencia.ScoreResultDTO;
import com.jis.modelo.Job;
import com.jis.modelo.JobScore;
import com.jis.repositorio.JobRepository;
import com.jis.repositorio.JobScoreRepository;
import com.jis.pontuacao.ScoringEngine;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ScoringService {

    private final ScoringEngine scoringEngine;
    private final JobScoreRepository jobScoreRepository;
    private final JobRepository jobRepository;
    private final MLServiceClient mlServiceClient;
    private final MetricsService metricsService;

    // Padrão Observer: escuta evento de nova vaga e calcula score automaticamente
    @Async
    @EventListener
    @Transactional
    public void onJobSaved(JobService.JobSavedEvent event) {
        log.debug("Calculando score para vaga: {}", event.job().getId());
        scoreJob(event.job());
    }

    @Transactional
    public JobScore scoreJob(Job job) {
        ScoreResultDTO rulesResult = scoringEngine.calculate(job);

        // Tenta obter score do serviço de ML (com fallback se indisponível)
        double mlScore = 0.0;
        try {
            mlScore = mlServiceClient.predict(job);
        } catch (Exception e) {
            log.warn("ML Service indisponivel para vaga {}: {}", job.getId(), e.getMessage());
        }

        double finalScore = scoringEngine.calculateFinalScore(
            rulesResult.getScoreRules(),
            mlScore,
            0.0
        );

        JobScore score = JobScore.builder()
            .job(job)
            .scoreRules(rulesResult.getScoreRules())
            .scoreMl(mlScore)
            .scoreCompany(0.0)
            .finalScore(finalScore)
            .scoreBreakdown(rulesResult.getBreakdown())
            .notified(false)
            .calculatedAt(LocalDateTime.now())
            .build();

        JobScore saved = jobScoreRepository.save(score);
        metricsService.incrementJobsScored(1);
        return saved;
    }

    @Transactional
    public int scoreAllPending() {
        List<Job> jobsWithoutScore = jobRepository.findJobsWithoutScore();
        log.info("Calculando score para {} vagas pendentes", jobsWithoutScore.size());

        int count = 0;
        for (Job job : jobsWithoutScore) {
            try {
                scoreJob(job);
                count++;
            } catch (Exception e) {
                log.error("Erro ao calcular score para vaga {}: {}", job.getId(), e.getMessage());
            }
        }

        return count;
    }
}
