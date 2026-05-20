package com.jis.servico;

import com.jis.transferencia.JobDTO;
import com.jis.modelo.Job;
import com.jis.coletor.ScraperFactory;
import com.jis.coletor.ScraperStrategy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

@Slf4j
@Service
@RequiredArgsConstructor
public class CollectorService {

    private final ScraperFactory scraperFactory;
    private final JobService jobService;
    private final MetricsService metricsService;

    public CollectionResult collectAll() {
        List<ScraperStrategy> scrapers = scraperFactory.getAllEnabled();
        AtomicInteger collected = new AtomicInteger(0);
        AtomicInteger newJobs = new AtomicInteger(0);
        List<String> errors = new ArrayList<>();

        log.info("Iniciando coleta com {} scrapers", scrapers.size());

        for (ScraperStrategy scraper : scrapers) {
            try {
                log.info("Executando scraper: {}", scraper.getSourceName());
                List<JobDTO> jobs = scraper.scrape();
                collected.addAndGet(jobs.size());

                for (JobDTO dto : jobs) {
                    try {
                        Job saved = jobService.saveIfNew(dto);
                        if (saved != null) {
                            newJobs.incrementAndGet();
                        }
                    } catch (Exception e) {
                        log.warn("Erro ao salvar vaga {}: {}", dto.getExternalId(), e.getMessage());
                    }
                }

                log.info("Scraper {}: {} coletadas, {} novas",
                    scraper.getSourceName(), jobs.size(), newJobs.get());

            } catch (Exception e) {
                String error = scraper.getSourceName() + ": " + e.getMessage();
                errors.add(error);
                log.error("Erro no scraper {}: {}", scraper.getSourceName(), e.getMessage());
            }
        }

        metricsService.incrementJobsCollected(newJobs.get());

        CollectionResult result = new CollectionResult(
            collected.get(),
            newJobs.get(),
            scrapers.size(),
            errors
        );

        log.info("Coleta finalizada: {} analisadas, {} novas vagas", collected.get(), newJobs.get());
        return result;
    }

    public record CollectionResult(
        int totalAnalyzed,
        int newJobs,
        int scrapersRun,
        List<String> errors
    ) {}
}
