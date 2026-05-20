package com.jis.transferencia;

import lombok.*;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScoreResultDTO {
    private Double scoreRules;
    private Double scoreMl;
    private Double scoreCompany;
    private Double finalScore;
    private Map<String, Double> breakdown;
}
