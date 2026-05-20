package com.jis.agendador;

import com.jis.servico.CollectorService;
import com.jis.servico.NotificationService;
import com.jis.servico.ScoringService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class DailyScheduler {

    private final CollectorService collectorService;
    private final ScoringService scoringService;
    private final NotificationService notificationService;

    // Pipeline completo: coleta → score → email às 19h (configurável por SCHEDULER_CRON)
    @Scheduled(cron = "${scheduler.daily.cron:0 0 19 * * *}")
    public void dailyPipeline() {
        log.info("=== INICIANDO PIPELINE DIARIO JIS ===");
        long start = System.currentTimeMillis();

        try {
            log.info("Passo 1: Coletando vagas de todas as fontes...");
            CollectorService.CollectionResult result = collectorService.collectAll();
            log.info("Coleta: {} analisadas, {} novas vagas", result.totalAnalyzed(), result.newJobs());

            log.info("Passo 2: Calculando scores das vagas pendentes...");
            int scored = scoringService.scoreAllPending();
            log.info("Score: {} vagas avaliadas", scored);

            log.info("Passo 3: Enviando email com top vagas...");
            int notified = notificationService.notifyTopJobs();
            log.info("Email: {} vagas notificadas", notified);

            long duration = System.currentTimeMillis() - start;
            log.info("=== PIPELINE CONCLUIDO em {}ms ===", duration);

        } catch (Exception e) {
            log.error("Erro no pipeline diario: {}", e.getMessage(), e);
        }
    }

    // Coleta extra ao meio-dia para capturar vagas da manhã
    @Scheduled(cron = "0 0 12 * * *")
    public void middayCollection() {
        log.info("Coleta do meio-dia iniciada");
        try {
            collectorService.collectAll();
        } catch (Exception e) {
            log.error("Erro na coleta do meio-dia: {}", e.getMessage());
        }
    }
}
