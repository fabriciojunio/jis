package com.jis.modelo;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "jobs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Job {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "external_id", unique = true, nullable = false, length = 300)
    private String externalId;

    @Column(nullable = false, length = 300)
    private String title;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id")
    private Company company;

    @Column(name = "company_name", length = 200)
    private String companyName;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 1000)
    private String link;

    @Column(nullable = false, length = 50)
    private String source;

    @Column
    @Builder.Default
    private Boolean remote = false;

    @Column
    @Builder.Default
    private Boolean hybrid = false;

    @Column(length = 30)
    private String level;

    @Column(name = "level_detected", length = 30)
    private String levelDetected;

    @Column(columnDefinition = "TEXT[]")
    @org.hibernate.annotations.Array(length = 50)
    private List<String> techs;

    @Column(name = "salary_min")
    private Integer salaryMin;

    @Column(name = "salary_max")
    private Integer salaryMax;

    @Column(name = "salary_informed")
    @Builder.Default
    private Boolean salaryInformed = false;

    @Column(length = 200)
    private String location;

    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    @Column(name = "days_open")
    @Builder.Default
    private Integer daysOpen = 0;

    @Column
    @Builder.Default
    private Boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
