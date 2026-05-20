package com.jis.transferencia;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobResponseDTO {
    private Long id;
    private String title;
    private String companyName;
    private String link;
    private String source;
    private Boolean remote;
    private Boolean hybrid;
    private String level;
    private List<String> techs;
    private Integer salaryMin;
    private Integer salaryMax;
    private Boolean salaryInformed;
    private String location;
    private Double finalScore;
    private Double scoreMl;
    private Map<String, Double> scoreBreakdown;
    private LocalDateTime publishedAt;
    private LocalDateTime createdAt;
}
