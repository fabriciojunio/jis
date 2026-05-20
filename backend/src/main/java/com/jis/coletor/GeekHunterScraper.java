package com.jis.coletor;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jis.transferencia.JobDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class GeekHunterScraper implements ScraperStrategy {

    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    private static final String GEEK_API = "https://www.geekHunter.com.br/public_api/v1/opportunities";

    @Override
    public List<JobDTO> scrape() {
        List<JobDTO> jobs = new ArrayList<>();

        try {
            String response = webClient.get()
                .uri(uriBuilder -> uriBuilder
                    .scheme("https")
                    .host("www.geekHunter.com.br")
                    .path("/public_api/v1/opportunities")
                    .queryParam("remote", true)
                    .queryParam("published", true)
                    .build())
                .header("User-Agent", "Mozilla/5.0 (compatible; JIS/1.0)")
                .retrieve()
                .bodyToMono(String.class)
                .block();

            if (response == null) return jobs;

            JsonNode root = objectMapper.readTree(response);
            JsonNode results = root.path("results");

            if (results.isArray()) {
                for (JsonNode jobNode : results) {
                    try {
                        JobDTO job = parseGeekHunterJob(jobNode);
                        if (job != null) jobs.add(job);
                    } catch (Exception e) {
                        log.warn("GeekHunter: erro ao parsear vaga: {}", e.getMessage());
                    }
                }
            }

            log.info("GeekHunter: {} vagas encontradas", jobs.size());
        } catch (Exception e) {
            log.error("GeekHunter: erro na requisicao: {}", e.getMessage());
        }

        return jobs;
    }

    private JobDTO parseGeekHunterJob(JsonNode node) {
        String id = node.path("id").asText();
        String title = node.path("title").asText();
        if (id.isEmpty() || title.isEmpty()) return null;

        boolean remote = node.path("remote").asBoolean(false);
        String company = node.path("company").path("name").asText("Empresa");

        // Extrai informações de salário quando disponível
        Integer salaryMin = null;
        Integer salaryMax = null;
        boolean salaryInformed = false;

        JsonNode salaryNode = node.path("salary");
        if (!salaryNode.isMissingNode()) {
            salaryMin = salaryNode.path("minimum").asInt(0);
            salaryMax = salaryNode.path("maximum").asInt(0);
            salaryInformed = salaryMin > 0 || salaryMax > 0;
        }

        // Extrai lista de tecnologias exigidas
        List<String> techs = new ArrayList<>();
        JsonNode skillsNode = node.path("skills");
        if (skillsNode.isArray()) {
            for (JsonNode skill : skillsNode) {
                techs.add(skill.path("name").asText());
            }
        }

        LocalDateTime publishedAt = null;
        String publishedStr = node.path("published_at").asText();
        if (!publishedStr.isEmpty() && !publishedStr.equals("null")) {
            try {
                publishedAt = LocalDateTime.parse(publishedStr, DateTimeFormatter.ISO_DATE_TIME);
            } catch (Exception ignored) {}
        }

        return JobDTO.builder()
            .externalId("geekHunter-" + id)
            .title(title)
            .companyName(company)
            .description(node.path("description").asText(""))
            .link("https://www.geekHunter.com.br/vagas/" + id)
            .source("geekHunter")
            .remote(remote)
            .hybrid(false)
            .techs(techs)
            .salaryMin(salaryMin)
            .salaryMax(salaryMax)
            .salaryInformed(salaryInformed)
            .publishedAt(publishedAt)
            .build();
    }

    @Override
    public String getSourceName() {
        return "geekHunter";
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
