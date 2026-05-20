package com.jis.transferencia;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobDTO {
    private String externalId;
    private String title;
    private String companyName;
    private String description;
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
    private LocalDateTime publishedAt;
}
