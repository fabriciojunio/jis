package com.jis.servico;

import com.jis.modelo.Application;
import com.jis.modelo.Job;
import com.jis.repositorio.ApplicationRepository;
import com.jis.repositorio.JobRepository;
import com.jis.transferencia.ApplicationDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final JobRepository jobRepository;
    private final MetricsService metricsService;

    @Transactional
    public ApplicationDTO apply(Long jobId, String notes) {
        if (applicationRepository.existsByJobId(jobId)) {
            throw new IllegalStateException("Candidatura ja existe para vaga: " + jobId);
        }

        Job job = jobRepository.findById(jobId)
            .orElseThrow(() -> new RuntimeException("Vaga nao encontrada: " + jobId));

        Application application = Application.builder()
            .job(job)
            .appliedAt(LocalDateTime.now())
            .stage("applied")
            .notes(notes)
            .build();

        Application saved = applicationRepository.save(application);
        metricsService.incrementApplicationsSent();
        log.info("Candidatura registrada: vaga={}, stage={}", jobId, saved.getStage());
        return toDTO(saved);
    }

    @Transactional
    public ApplicationDTO updateStage(Long id, String newStage) {
        Application app = applicationRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Candidatura nao encontrada: " + id));

        app.setStage(newStage);

        // Qualquer estágio que indica contato da empresa (positivo ou rejeição)
        if (List.of("hr", "technical", "offer", "rejected", "response", "interview").contains(newStage)) {
            app.setResponseReceived(true);
            if (app.getResponseAt() == null) {
                app.setResponseAt(LocalDateTime.now());
            }
        }

        return toDTO(applicationRepository.save(app));
    }

    @Transactional(readOnly = true)
    public List<ApplicationDTO> getAll() {
        return applicationRepository.findAll().stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ApplicationDTO> getByStage(String stage) {
        return applicationRepository.findByStageOrderByCreatedAtDesc(stage).stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    private ApplicationDTO toDTO(Application app) {
        return ApplicationDTO.builder()
            .id(app.getId())
            .jobId(app.getJob().getId())
            .jobTitle(app.getJob().getTitle())
            .companyName(app.getJob().getCompanyName())
            .stage(app.getStage())
            .responseReceived(app.getResponseReceived())
            .appliedAt(app.getAppliedAt())
            .responseAt(app.getResponseAt())
            .notes(app.getNotes())
            .build();
    }
}
