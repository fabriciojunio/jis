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
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Slf4j
@Component
@RequiredArgsConstructor
public class GupyScraper implements ScraperStrategy {

    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    // URL da API pública da Gupy
    private static final String GUPY_API = "https://portal.api.gupy.io/api/v1/jobs";
    private static final List<String> SEARCH_TERMS = List.of(
        "java junior", "desenvolvedor java", "python junior",
        "fullstack junior", "node junior", "react developer junior",
        "backend junior", "data science junior", "machine learning junior"
    );

    @Override
    public List<JobDTO> scrape() {
        List<JobDTO> jobs = new ArrayList<>();

        for (String term : SEARCH_TERMS) {
            try {
                List<JobDTO> termJobs = scrapeByTerm(term);
                jobs.addAll(termJobs);
                log.info("Gupy: {} vagas encontradas para '{}'", termJobs.size(), term);
                Thread.sleep(1000); // pausa para respeitar o limite de requisições da API
            } catch (Exception e) {
                log.error("Gupy: erro ao buscar '{}': {}", term, e.getMessage());
            }
        }

        return deduplicateByExternalId(jobs);
    }

    private List<JobDTO> scrapeByTerm(String term) {
        List<JobDTO> jobs = new ArrayList<>();

        try {
            String response = webClient.get()
                .uri(uriBuilder -> uriBuilder
                    .scheme("https")
                    .host("portal.api.gupy.io")
                    .path("/api/v1/jobs")
                    .queryParam("jobName", term)
                    .queryParam("limit", 50)
                    .queryParam("offset", 0)
                    .build())
                .retrieve()
                .bodyToMono(String.class)
                .block();

            if (response == null) return jobs;

            JsonNode root = objectMapper.readTree(response);
            JsonNode jobsNode = root.path("data");

            if (jobsNode.isArray()) {
                for (JsonNode jobNode : jobsNode) {
                    try {
                        JobDTO job = parseGupyJob(jobNode);
                        if (job != null) jobs.add(job);
                    } catch (Exception e) {
                        log.warn("Gupy: erro ao parsear vaga: {}", e.getMessage());
                    }
                }
            }
        } catch (Exception e) {
            log.error("Gupy: erro na requisicao para '{}': {}", term, e.getMessage());
        }

        return jobs;
    }

    private JobDTO parseGupyJob(JsonNode node) {
        String id = node.path("id").asText();
        String title = node.path("name").asText();
        String company = node.path("careerPageName").asText();
        String link = node.path("jobUrl").asText();

        if (id.isEmpty() || title.isEmpty()) return null;

        boolean remote = node.path("workplaceType").asText().equalsIgnoreCase("remote");
        boolean hybrid = node.path("workplaceType").asText().equalsIgnoreCase("hybrid");
        String location = node.path("city").asText() + ", " + node.path("state").asText();

        LocalDateTime publishedAt = null;
        String publishedStr = node.path("publishedDate").asText();
        if (!publishedStr.isEmpty() && !publishedStr.equals("null")) {
            try {
                publishedAt = LocalDateTime.parse(publishedStr, DateTimeFormatter.ISO_DATE_TIME);
            } catch (Exception ignored) {}
        }

        return JobDTO.builder()
            .externalId("gupy-" + id)
            .title(title)
            .companyName(company)
            .description(node.path("description").asText("Sem descricao"))
            .link(link)
            .source("gupy")
            .remote(remote)
            .hybrid(hybrid)
            .location(location)
            .salaryInformed(false)
            .publishedAt(publishedAt)
            .build();
    }

    private List<JobDTO> deduplicateByExternalId(List<JobDTO> jobs) {
        Set<String> seen = new HashSet<>();
        return jobs.stream()
            .filter(job -> seen.add(job.getExternalId()))
            .toList();
    }

    @Override
    public String getSourceName() {
        return "gupy";
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
