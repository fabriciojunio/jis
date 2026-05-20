package com.jis.modelo;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.Map;

@Entity
@Table(name = "job_scores")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobScore {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_id", unique = true, nullable = false)
    private Job job;

    @Column(name = "score_rules")
    @Builder.Default
    private Double scoreRules = 0.0;

    @Column(name = "score_ml")
    @Builder.Default
    private Double scoreMl = 0.0;

    @Column(name = "score_company")
    @Builder.Default
    private Double scoreCompany = 0.0;

    @Column(name = "final_score")
    @Builder.Default
    private Double finalScore = 0.0;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "score_breakdown", columnDefinition = "jsonb")
    private Map<String, Double> scoreBreakdown;

    @Column
    @Builder.Default
    private Boolean notified = false;

    @Column(name = "calculated_at")
    private LocalDateTime calculatedAt;

    @PrePersist
    public void prePersist() {
        this.calculatedAt = LocalDateTime.now();
    }
}
