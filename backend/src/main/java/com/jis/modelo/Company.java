package com.jis.modelo;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "companies")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Company {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(name = "glassdoor_score")
    private Double glassdoorScore;

    @Column(name = "glassdoor_reviews_count")
    private Integer glassdoorReviewsCount;

    @Column(length = 50)
    private String size;

    @Column(name = "funding_stage", length = 50)
    private String fundingStage;

    @Column(name = "verified_good")
    @Builder.Default
    private Boolean verifiedGood = false;

    @Column(name = "blacklisted")
    @Builder.Default
    private Boolean blacklisted = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
