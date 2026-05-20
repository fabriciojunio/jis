package com.jis.servico;

import com.jis.modelo.Application;
import com.jis.modelo.Job;
import com.jis.repositorio.ApplicationRepository;
import com.jis.repositorio.JobRepository;
import com.jis.transferencia.ApplicationDTO;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ApplicationService - Testes Unitarios")
class ApplicationServiceTest {

    @Mock
    private ApplicationRepository applicationRepository;

    @Mock
    private JobRepository jobRepository;

    @Mock
    private MetricsService metricsService;

    @InjectMocks
    private ApplicationService applicationService;

    @Test
    @DisplayName("Deve registrar candidatura com sucesso")
    void shouldApplySuccessfully() {
        Job job = Job.builder().id(1L).title("Dev Java Junior").companyName("TechCo").build();
        Application saved = Application.builder()
            .id(1L).job(job).stage("applied").build();

        when(applicationRepository.existsByJobId(1L)).thenReturn(false);
        when(jobRepository.findById(1L)).thenReturn(Optional.of(job));
        when(applicationRepository.save(any())).thenReturn(saved);

        ApplicationDTO result = applicationService.apply(1L, null);

        assertThat(result.getJobTitle()).isEqualTo("Dev Java Junior");
        assertThat(result.getStage()).isEqualTo("applied");
        verify(metricsService).incrementApplicationsSent();
    }

    @Test
    @DisplayName("Deve salvar notes quando informadas")
    void shouldSaveNotesWhenProvided() {
        Job job = Job.builder().id(1L).title("Dev Java Junior").companyName("TechCo").build();
        Application saved = Application.builder()
            .id(1L).job(job).stage("applied").notes("Achei interessante").build();

        when(applicationRepository.existsByJobId(1L)).thenReturn(false);
        when(jobRepository.findById(1L)).thenReturn(Optional.of(job));
        when(applicationRepository.save(any())).thenReturn(saved);

        ApplicationDTO result = applicationService.apply(1L, "Achei interessante");

        assertThat(result.getNotes()).isEqualTo("Achei interessante");
    }

    @Test
    @DisplayName("Deve lancar excecao quando candidatura ja existe")
    void shouldThrowWhenApplicationAlreadyExists() {
        when(applicationRepository.existsByJobId(1L)).thenReturn(true);

        assertThatThrownBy(() -> applicationService.apply(1L, null))
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("1");

        verify(applicationRepository, never()).save(any());
        verify(metricsService, never()).incrementApplicationsSent();
    }

    @Test
    @DisplayName("Deve lancar excecao quando vaga nao encontrada")
    void shouldThrowWhenJobNotFound() {
        when(applicationRepository.existsByJobId(99L)).thenReturn(false);
        when(jobRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> applicationService.apply(99L, null))
            .isInstanceOf(RuntimeException.class)
            .hasMessageContaining("99");
    }

    @Test
    @DisplayName("Deve atualizar estagio da candidatura")
    void shouldUpdateStageSuccessfully() {
        Job job = Job.builder().id(1L).title("Dev Java Junior").companyName("TechCo").build();
        Application app = Application.builder().id(1L).job(job).stage("applied").build();

        when(applicationRepository.findById(1L)).thenReturn(Optional.of(app));
        when(applicationRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        ApplicationDTO result = applicationService.updateStage(1L, "screening");

        assertThat(result.getStage()).isEqualTo("screening");
    }

    @ParameterizedTest(name = "stage={0} deve marcar responseReceived=true")
    @ValueSource(strings = {"hr", "technical", "offer", "rejected", "response", "interview"})
    @DisplayName("Deve marcar resposta recebida nos stages que indicam contato da empresa")
    void shouldMarkResponseReceivedOnResponseStages(String stage) {
        Job job = Job.builder().id(1L).title("Dev Java").companyName("Co").build();
        Application app = Application.builder()
            .id(1L).job(job).stage("screening").responseReceived(false).build();

        when(applicationRepository.findById(1L)).thenReturn(Optional.of(app));
        when(applicationRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        ApplicationDTO result = applicationService.updateStage(1L, stage);

        assertThat(result.getResponseReceived()).isTrue();
        assertThat(result.getResponseAt()).isNotNull();
    }

    @ParameterizedTest(name = "stage={0} nao deve alterar responseReceived")
    @ValueSource(strings = {"applied", "screening", "pending"})
    @DisplayName("Nao deve alterar responseReceived em stages neutros")
    void shouldNotSetResponseReceivedOnNeutralStages(String stage) {
        Job job = Job.builder().id(1L).title("Dev Java").companyName("Co").build();
        Application app = Application.builder()
            .id(1L).job(job).stage("applied").responseReceived(false).build();

        when(applicationRepository.findById(1L)).thenReturn(Optional.of(app));
        when(applicationRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        ApplicationDTO result = applicationService.updateStage(1L, stage);

        assertThat(result.getResponseReceived()).isFalse();
    }

    @Test
    @DisplayName("Deve listar todas as candidaturas")
    void shouldListAllApplications() {
        Job job = Job.builder().id(1L).title("Dev Java").companyName("Co").build();
        List<Application> apps = List.of(
            Application.builder().id(1L).job(job).stage("applied").build(),
            Application.builder().id(2L).job(job).stage("screening").build()
        );
        when(applicationRepository.findAll()).thenReturn(apps);

        List<ApplicationDTO> result = applicationService.getAll();

        assertThat(result).hasSize(2);
        assertThat(result).extracting(ApplicationDTO::getStage)
            .containsExactly("applied", "screening");
    }

    @Test
    @DisplayName("Deve listar candidaturas por estagio")
    void shouldListByStage() {
        Job job = Job.builder().id(1L).title("Dev Java").companyName("Co").build();
        List<Application> apps = List.of(
            Application.builder().id(1L).job(job).stage("screening").build()
        );
        when(applicationRepository.findByStageOrderByCreatedAtDesc("screening")).thenReturn(apps);

        List<ApplicationDTO> result = applicationService.getByStage("screening");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getStage()).isEqualTo("screening");
    }
}
