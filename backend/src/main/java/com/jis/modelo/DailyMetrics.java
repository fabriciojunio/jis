package com.jis.modelo;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "daily_metrics")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyMetrics {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private LocalDate date;

    @Column(name = "jobs_collected")
    @Builder.Default
    private Integer jobsCollected = 0;

    @Column(name = "jobs_scored")
    @Builder.Default
    private Integer jobsScored = 0;

    @Column(name = "jobs_notified")
    @Builder.Default
    private Integer jobsNotified = 0;

    @Column(name = "applications_sent")
    @Builder.Default
    private Integer applicationsSent = 0;

    @Column(name = "responses_received")
    @Builder.Default
    private Integer responsesReceived = 0;

    @Column(name = "interviews_scheduled")
    @Builder.Default
    private Integer interviewsScheduled = 0;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
