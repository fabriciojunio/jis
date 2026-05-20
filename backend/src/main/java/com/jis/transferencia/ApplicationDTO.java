package com.jis.transferencia;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApplicationDTO {
    private Long id;
    private Long jobId;
    private String jobTitle;
    private String companyName;
    private String stage;
    private Boolean responseReceived;
    private LocalDateTime appliedAt;
    private LocalDateTime responseAt;
    private String notes;
}
