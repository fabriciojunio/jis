package com.jis.servico;

import com.jis.modelo.Job;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class MLServiceClient {

    private final WebClient webClient;

    @Value("${ml.service.url}")
    private String mlServiceUrl;

    public double predict(Job job) {
        try {
            Map<String, Object> features = buildFeatures(job);

            Map<?, ?> response = webClient.post()
                .uri(mlServiceUrl + "/predict")
                .bodyValue(features)
                .retrieve()
                .bodyToMono(Map.class)
                .block();

            if (response != null && response.containsKey("probability")) {
                return ((Number) response.get("probability")).doubleValue();
            }
        } catch (Exception e) {
            log.warn("ML Service indisponivel: {}", e.getMessage());
        }

        return 0.0; // valor padrão quando o serviço de ML está indisponível
    }

    private Map<String, Object> buildFeatures(Job job) {
        Map<String, Object> features = new HashMap<>();

        List<String> techs = job.getTechs() != null ? job.getTechs() : List.of();
        String techStr = String.join(" ", techs).toLowerCase();
        String desc = (job.getDescription() != null ? job.getDescription() : "").toLowerCase();
        String content = techStr + " " + desc;

        features.put("is_remote", Boolean.TRUE.equals(job.getRemote()) ? 1 : 0);
        features.put("salary_informed", Boolean.TRUE.equals(job.getSalaryInformed()) ? 1 : 0);
        features.put("has_java", content.contains("java") ? 1 : 0);
        features.put("has_python", content.contains("python") ? 1 : 0);
        features.put("has_react", content.contains("react") ? 1 : 0);
        features.put("has_ml_skills", (content.contains("machine learning") ||
                                        content.contains("scikit") ||
                                        content.contains("nlp")) ? 1 : 0);
        features.put("level_match", isJuniorOrPleno(job) ? 1 : 0);

        return features;
    }

    private boolean isJuniorOrPleno(Job job) {
        String content = (job.getTitle() + " " + job.getDescription()).toLowerCase();
        return content.contains("junior") || content.contains("jr") ||
               content.contains("pleno") || content.contains("entry level");
    }
}
