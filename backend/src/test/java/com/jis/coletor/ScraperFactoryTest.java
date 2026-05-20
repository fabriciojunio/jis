package com.jis.coletor;

import com.jis.transferencia.JobDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@DisplayName("ScraperFactory - Testes Unitarios")
class ScraperFactoryTest {

    private ScraperFactory factory;
    private ScraperStrategy gupyScraper;
    private ScraperStrategy geekHunterScraper;
    private ScraperStrategy disabledScraper;

    @BeforeEach
    void setUp() {
        gupyScraper = mock(ScraperStrategy.class);
        when(gupyScraper.getSourceName()).thenReturn("gupy");
        when(gupyScraper.isEnabled()).thenReturn(true);

        geekHunterScraper = mock(ScraperStrategy.class);
        when(geekHunterScraper.getSourceName()).thenReturn("geekHunter");
        when(geekHunterScraper.isEnabled()).thenReturn(true);

        disabledScraper = mock(ScraperStrategy.class);
        when(disabledScraper.getSourceName()).thenReturn("disabled");
        when(disabledScraper.isEnabled()).thenReturn(false);

        factory = new ScraperFactory(List.of(gupyScraper, geekHunterScraper, disabledScraper));
    }

    @Test
    @DisplayName("Deve retornar scraper correto pelo nome")
    void shouldReturnCorrectScraperByName() {
        ScraperStrategy scraper = factory.getScraper("gupy");
        assertThat(scraper.getSourceName()).isEqualTo("gupy");
    }

    @Test
    @DisplayName("Deve lancar excecao para scraper desconhecido")
    void shouldThrowExceptionForUnknownScraper() {
        assertThatThrownBy(() -> factory.getScraper("unknown"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("unknown");
    }

    @Test
    @DisplayName("getAllEnabled deve retornar apenas scrapers habilitados")
    void shouldReturnOnlyEnabledScrapers() {
        List<ScraperStrategy> enabled = factory.getAllEnabled();

        assertThat(enabled).hasSize(2);
        assertThat(enabled).noneMatch(s -> s.getSourceName().equals("disabled"));
    }

    @Test
    @DisplayName("getAvailableSources deve retornar todos os nomes")
    void shouldReturnAllSourceNames() {
        List<String> sources = factory.getAvailableSources();

        assertThat(sources).containsExactlyInAnyOrder("gupy", "geekHunter", "disabled");
    }
}
