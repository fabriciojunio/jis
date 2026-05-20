package com.jis.servico;

import com.jis.transferencia.JobDTO;
import com.jis.modelo.Job;
import com.jis.repositorio.JobRepository;
import com.jis.repositorio.JobScoreRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("JobService - Testes Unitarios")
class JobServiceTest {

    @Mock
    private JobRepository jobRepository;

    @Mock
    private JobScoreRepository jobScoreRepository;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private JobService jobService;

    private JobDTO validJobDTO;

    @BeforeEach
    void setUp() {
        validJobDTO = JobDTO.builder()
            .externalId("gupy-123")
            .title("Desenvolvedor Java Junior")
            .companyName("TechCorp")
            .description("Vaga para dev Java")
            .link("https://empresa.gupy.io/jobs/123")
            .source("gupy")
            .remote(true)
            .hybrid(false)
            .salaryInformed(true)
            .salaryMin(4000)
            .salaryMax(6000)
            .publishedAt(LocalDateTime.now())
            .build();
    }

    @Test
    @DisplayName("Deve salvar vaga nova e publicar evento")
    void shouldSaveNewJobAndPublishEvent() {
        when(jobRepository.existsByExternalId("gupy-123")).thenReturn(false);
        when(jobRepository.save(any(Job.class))).thenAnswer(inv -> {
            Job job = inv.getArgument(0);
            job.setId(1L);
            return job;
        });

        Job result = jobService.saveIfNew(validJobDTO);

        assertThat(result).isNotNull();
        assertThat(result.getTitle()).isEqualTo("Desenvolvedor Java Junior");
        assertThat(result.getRemote()).isTrue();
        assertThat(result.getSalaryInformed()).isTrue();

        verify(jobRepository).save(any(Job.class));
        verify(eventPublisher).publishEvent(any(JobService.JobSavedEvent.class));
    }

    @Test
    @DisplayName("Nao deve salvar vaga duplicada")
    void shouldNotSaveDuplicateJob() {
        when(jobRepository.existsByExternalId("gupy-123")).thenReturn(true);

        Job result = jobService.saveIfNew(validJobDTO);

        assertThat(result).isNull();
        verify(jobRepository, never()).save(any());
        verify(eventPublisher, never()).publishEvent(any());
    }

    @Test
    @DisplayName("Deve tratar descricao nula como string vazia")
    void shouldHandleNullDescription() {
        validJobDTO.setDescription(null);
        when(jobRepository.existsByExternalId(any())).thenReturn(false);
        when(jobRepository.save(any(Job.class))).thenAnswer(inv -> inv.getArgument(0));

        Job result = jobService.saveIfNew(validJobDTO);

        assertThat(result).isNotNull();
        assertThat(result.getDescription()).isEmpty();
    }

    @Test
    @DisplayName("Deve tratar remote nulo como false")
    void shouldHandleNullRemote() {
        validJobDTO.setRemote(null);
        when(jobRepository.existsByExternalId(any())).thenReturn(false);
        when(jobRepository.save(any(Job.class))).thenAnswer(inv -> inv.getArgument(0));

        Job result = jobService.saveIfNew(validJobDTO);

        assertThat(result).isNotNull();
        assertThat(result.getRemote()).isFalse();
    }

    @Test
    @DisplayName("countTodayJobs deve delegar para o repository")
    void shouldDelegateCountTodayJobsToRepository() {
        when(jobRepository.countTodayJobs()).thenReturn(42L);

        Long count = jobService.countTodayJobs();

        assertThat(count).isEqualTo(42L);
        verify(jobRepository).countTodayJobs();
    }

    @Test
    @DisplayName("getTopJobs deve retornar lista de DTOs")
    void shouldReturnTopJobsAsDTOs() {
        when(jobScoreRepository.findTopUnnotified(10)).thenReturn(List.of());

        var result = jobService.getTopJobs(10);

        assertThat(result).isNotNull();
        verify(jobScoreRepository).findTopUnnotified(10);
    }
}
