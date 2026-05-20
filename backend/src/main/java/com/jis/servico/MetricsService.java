package com.jis.servico;

import com.jis.transferencia.MetricsDTO;
import com.jis.modelo.DailyMetrics;
import com.jis.repositorio.ApplicationRepository;
import com.jis.repositorio.DailyMetricsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MetricsService {

    private final DailyMetricsRepository metricsRepository;
    private final ApplicationRepository applicationRepository;

    @Transactional
    public void incrementJobsCollected(int count) {
        DailyMetrics metrics = getTodayMetrics();
        metrics.setJobsCollected(metrics.getJobsCollected() + count);
        metricsRepository.save(metrics);
    }

    @Transactional
    public void incrementJobsScored(int count) {
        DailyMetrics metrics = getTodayMetrics();
        metrics.setJobsScored(metrics.getJobsScored() + count);
        metricsRepository.save(metrics);
    }

    @Transactional
    public void incrementJobsNotified(int count) {
        DailyMetrics metrics = getTodayMetrics();
        metrics.setJobsNotified(metrics.getJobsNotified() + count);
        metricsRepository.save(metrics);
    }

    @Transactional
    public void incrementApplicationsSent() {
        DailyMetrics metrics = getTodayMetrics();
        metrics.setApplicationsSent(metrics.getApplicationsSent() + 1);
        metricsRepository.save(metrics);
    }

    public List<MetricsDTO> getLast30Days() {
        double rate = getCallbackRate();
        return metricsRepository.findTop30ByOrderByDateDesc()
            .stream()
            .map(m -> toDTO(m, rate))
            .collect(Collectors.toList());
    }

    public MetricsDTO getTodayDTO() {
        return toDTO(getTodayMetrics(), getCallbackRate());
    }

    public double getCallbackRate() {
        Long total = applicationRepository.countTotalApplications();
        Long responses = applicationRepository.countResponsesReceived();

        if (total == null || total == 0) return 0.0;
        if (responses == null) return 0.0;

        return Math.round((responses.doubleValue() / total.doubleValue()) * 1000.0) / 10.0;
    }

    private DailyMetrics getTodayMetrics() {
        return metricsRepository.findByDate(LocalDate.now())
            .orElseGet(() -> metricsRepository.save(
                DailyMetrics.builder()
                    .date(LocalDate.now())
                    .build()
            ));
    }

    private MetricsDTO toDTO(DailyMetrics m, double callbackRate) {
        return MetricsDTO.builder()
            .date(m.getDate())
            .jobsCollected(m.getJobsCollected())
            .jobsScored(m.getJobsScored())
            .jobsNotified(m.getJobsNotified())
            .applicationsSent(m.getApplicationsSent())
            .responsesReceived(m.getResponsesReceived())
            .interviewsScheduled(m.getInterviewsScheduled())
            .callbackRate(callbackRate)
            .build();
    }
}
