package com.jis.servico;

import com.jis.transferencia.MetricsDTO;
import com.jis.modelo.DailyMetrics;
import com.jis.repositorio.ApplicationRepository;
import com.jis.repositorio.DailyMetricsRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("MetricsService - Testes Unitarios")
class MetricsServiceTest {

    @Mock
    private DailyMetricsRepository metricsRepository;

    @Mock
    private ApplicationRepository applicationRepository;

    @InjectMocks
    private MetricsService metricsService;

    @Test
    @DisplayName("Deve criar metricas do dia quando nao existir")
    void shouldCreateTodayMetricsWhenNotExists() {
        when(metricsRepository.findByDate(LocalDate.now())).thenReturn(Optional.empty());
        when(metricsRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        metricsService.incrementJobsCollected(5);

        // save é chamado 2 vezes: 1 para criar o registro, 1 para atualizar o valor
        verify(metricsRepository, times(2)).save(any(DailyMetrics.class));
    }

    @Test
    @DisplayName("Deve incrementar jobs coletados")
    void shouldIncrementJobsCollected() {
        DailyMetrics existing = DailyMetrics.builder()
            .date(LocalDate.now())
            .jobsCollected(10)
            .build();
        when(metricsRepository.findByDate(LocalDate.now())).thenReturn(Optional.of(existing));
        when(metricsRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        metricsService.incrementJobsCollected(5);

        assertThat(existing.getJobsCollected()).isEqualTo(15);
    }

    @Test
    @DisplayName("Deve incrementar jobs avaliados")
    void shouldIncrementJobsScored() {
        DailyMetrics existing = DailyMetrics.builder()
            .date(LocalDate.now())
            .jobsScored(3)
            .build();
        when(metricsRepository.findByDate(LocalDate.now())).thenReturn(Optional.of(existing));
        when(metricsRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        metricsService.incrementJobsScored(2);

        assertThat(existing.getJobsScored()).isEqualTo(5);
    }

    @Test
    @DisplayName("Callback rate zero quando nao ha candidaturas")
    void shouldReturnZeroCallbackRateWhenNoApplications() {
        when(applicationRepository.countTotalApplications()).thenReturn(0L);
        when(applicationRepository.countResponsesReceived()).thenReturn(0L);

        double rate = metricsService.getCallbackRate();

        assertThat(rate).isEqualTo(0.0);
    }

    @Test
    @DisplayName("Callback rate calculada corretamente")
    void shouldCalculateCallbackRateCorrectly() {
        when(applicationRepository.countTotalApplications()).thenReturn(10L);
        when(applicationRepository.countResponsesReceived()).thenReturn(3L);

        double rate = metricsService.getCallbackRate();

        assertThat(rate).isEqualTo(30.0);
    }

    @Test
    @DisplayName("getLast30Days deve retornar lista de DTOs")
    void shouldReturnLast30DaysAsDTOs() {
        DailyMetrics m = DailyMetrics.builder()
            .date(LocalDate.now())
            .jobsCollected(20)
            .jobsNotified(5)
            .applicationsSent(3)
            .build();

        when(metricsRepository.findTop30ByOrderByDateDesc()).thenReturn(List.of(m));
        when(applicationRepository.countTotalApplications()).thenReturn(3L);
        when(applicationRepository.countResponsesReceived()).thenReturn(1L);

        List<MetricsDTO> result = metricsService.getLast30Days();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getJobsCollected()).isEqualTo(20);
    }
}
