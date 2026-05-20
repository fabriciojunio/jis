package com.jis.transferencia;

import lombok.*;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MetricsDTO {
    private LocalDate date;
    private Integer jobsCollected;
    private Integer jobsScored;
    private Integer jobsNotified;
    private Integer applicationsSent;
    private Integer responsesReceived;
    private Integer interviewsScheduled;
    private Double callbackRate;
}
