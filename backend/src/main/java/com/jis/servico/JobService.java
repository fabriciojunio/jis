package com.jis.servico;

import com.jis.transferencia.JobDTO;
import com.jis.transferencia.JobResponseDTO;
import com.jis.modelo.Job;
import com.jis.modelo.JobScore;
import com.jis.repositorio.JobRepository;
import com.jis.repositorio.JobScoreRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class JobService {

    private final JobRepository jobRepository;
    private final JobScoreRepository jobScoreRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public Job saveIfNew(JobDTO dto) {
        if (jobRepository.existsByExternalId(dto.getExternalId())) {
            log.debug("Vaga ja existe: {}", dto.getExternalId());
            return null;
        }

        Job job = Job.builder()
            .externalId(dto.getExternalId())
            .title(dto.getTitle())
            .companyName(dto.getCompanyName())
            .description(dto.getDescription() != null ? dto.getDescription() : "")
            .link(dto.getLink())
            .source(dto.getSource())
            .remote(dto.getRemote() != null ? dto.getRemote() : false)
            .hybrid(dto.getHybrid() != null ? dto.getHybrid() : false)
            .level(dto.getLevel())
            .techs(dto.getTechs())
            .salaryMin(dto.getSalaryMin())
            .salaryMax(dto.getSalaryMax())
            .salaryInformed(dto.getSalaryInformed() != null ? dto.getSalaryInformed() : false)
            .location(dto.getLocation())
            .publishedAt(dto.getPublishedAt())
            .active(true)
            .build();

        Job saved = jobRepository.save(job);
        log.info("Nova vaga salva: {} - {}", saved.getId(), saved.getTitle());

        eventPublisher.publishEvent(new JobSavedEvent(saved));
        return saved;
    }

    public List<JobResponseDTO> getTopJobs(int limit) {
        return jobScoreRepository
            .findTopUnnotified(limit)
            .stream()
            .map(this::toResponseDTO)
            .collect(Collectors.toList());
    }

    public List<JobResponseDTO> getAllJobs() {
        return jobRepository.findAllActiveOrderedByDate()
            .stream()
            .map(job -> {
                JobResponseDTO dto = toBasicResponseDTO(job);
                jobScoreRepository.findByJobId(job.getId()).ifPresent(score -> {
                    dto.setFinalScore(score.getFinalScore());
                    dto.setScoreMl(score.getScoreMl());
                    dto.setScoreBreakdown(score.getScoreBreakdown());
                });
                return dto;
            })
            .collect(Collectors.toList());
    }

    public Long countTodayJobs() {
        return jobRepository.countTodayJobs();
    }

    private JobResponseDTO toResponseDTO(JobScore score) {
        Job job = score.getJob();
        return JobResponseDTO.builder()
            .id(job.getId())
            .title(job.getTitle())
            .companyName(job.getCompanyName())
            .link(job.getLink())
            .source(job.getSource())
            .remote(job.getRemote())
            .hybrid(job.getHybrid())
            .level(job.getLevel())
            .techs(job.getTechs())
            .salaryMin(job.getSalaryMin())
            .salaryMax(job.getSalaryMax())
            .salaryInformed(job.getSalaryInformed())
            .location(job.getLocation())
            .finalScore(score.getFinalScore())
            .scoreMl(score.getScoreMl())
            .scoreBreakdown(score.getScoreBreakdown())
            .publishedAt(job.getPublishedAt())
            .createdAt(job.getCreatedAt())
            .build();
    }

    private JobResponseDTO toBasicResponseDTO(Job job) {
        return JobResponseDTO.builder()
            .id(job.getId())
            .title(job.getTitle())
            .companyName(job.getCompanyName())
            .link(job.getLink())
            .source(job.getSource())
            .remote(job.getRemote())
            .hybrid(job.getHybrid())
            .level(job.getLevel())
            .techs(job.getTechs())
            .salaryMin(job.getSalaryMin())
            .salaryMax(job.getSalaryMax())
            .salaryInformed(job.getSalaryInformed())
            .location(job.getLocation())
            .publishedAt(job.getPublishedAt())
            .createdAt(job.getCreatedAt())
            .build();
    }

    // Evento interno publicado quando nova vaga é salva
    public record JobSavedEvent(Job job) {}
}
