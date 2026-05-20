package com.jis.servico;

import com.jis.transferencia.JobDTO;
import com.jis.modelo.Job;
import com.jis.coletor.ScraperFactory;
import com.jis.coletor.ScraperStrategy;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("CollectorService - Testes Unitarios")
class CollectorServiceTest {

    @Mock
    private ScraperFactory scraperFactory;

    @Mock
    private JobService jobService;

    @Mock
    private MetricsService metricsService;

    @InjectMocks
    private CollectorService collectorService;

    @Test
    @DisplayName("Deve coletar vagas de todos scrapers habilitados")
    void shouldCollectFromAllEnabledScrapers() {
        ScraperStrategy scraper1 = mock(ScraperStrategy.class);
        ScraperStrategy scraper2 = mock(ScraperStrategy.class);

        when(scraper1.getSourceName()).thenReturn("gupy");
        when(scraper2.getSourceName()).thenReturn("geekHunter");

        JobDTO job1 = JobDTO.builder().externalId("gupy-1").title("Dev Java").build();
        JobDTO job2 = JobDTO.builder().externalId("gh-1").title("Dev Python").build();

        when(scraper1.scrape()).thenReturn(List.of(job1));
        when(scraper2.scrape()).thenReturn(List.of(job2));
        when(scraperFactory.getAllEnabled()).thenReturn(List.of(scraper1, scraper2));

        Job savedJob = Job.builder().id(1L).title("Dev Java").build();
        when(jobService.saveIfNew(any())).thenReturn(savedJob);

        CollectorService.CollectionResult result = collectorService.collectAll();

        assertThat(result.totalAnalyzed()).isEqualTo(2);
        assertThat(result.newJobs()).isEqualTo(2);
        assertThat(result.scrapersRun()).isEqualTo(2);
        assertThat(result.errors()).isEmpty();
    }

    @Test
    @DisplayName("Deve continuar mesmo se um scraper falhar")
    void shouldContinueWhenOneScraperFails() {
        ScraperStrategy goodScraper = mock(ScraperStrategy.class);
        ScraperStrategy badScraper = mock(ScraperStrategy.class);

        when(goodScraper.getSourceName()).thenReturn("gupy");
        when(badScraper.getSourceName()).thenReturn("broken");

        when(goodScraper.scrape()).thenReturn(List.of(
            JobDTO.builder().externalId("gupy-1").title("Dev Java").build()
        ));
        when(badScraper.scrape()).thenThrow(new RuntimeException("Connection refused"));
        when(scraperFactory.getAllEnabled()).thenReturn(List.of(goodScraper, badScraper));
        when(jobService.saveIfNew(any())).thenReturn(Job.builder().id(1L).build());

        CollectorService.CollectionResult result = collectorService.collectAll();

        assertThat(result.totalAnalyzed()).isEqualTo(1);
        assertThat(result.errors()).hasSize(1);
        assertThat(result.errors().get(0)).contains("broken");
    }

    @Test
    @DisplayName("Vaga duplicada nao deve incrementar contador de novas")
    void shouldNotCountDuplicateAsNewJob() {
        ScraperStrategy scraper = mock(ScraperStrategy.class);
        when(scraper.getSourceName()).thenReturn("gupy");
        when(scraper.scrape()).thenReturn(List.of(
            JobDTO.builder().externalId("gupy-dup").title("Dev Java").build()
        ));
        when(scraperFactory.getAllEnabled()).thenReturn(List.of(scraper));
        when(jobService.saveIfNew(any())).thenReturn(null); // null = duplicata

        CollectorService.CollectionResult result = collectorService.collectAll();

        assertThat(result.totalAnalyzed()).isEqualTo(1);
        assertThat(result.newJobs()).isEqualTo(0);
    }

    @Test
    @DisplayName("Resultado deve ter erros vazios quando tudo funciona")
    void shouldHaveEmptyErrorsWhenEverythingWorks() {
        when(scraperFactory.getAllEnabled()).thenReturn(List.of());

        CollectorService.CollectionResult result = collectorService.collectAll();

        assertThat(result.errors()).isEmpty();
        assertThat(result.totalAnalyzed()).isEqualTo(0);
    }
}
