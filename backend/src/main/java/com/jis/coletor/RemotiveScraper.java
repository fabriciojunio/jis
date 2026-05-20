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
public class RemotiveScraper implements ScraperStrategy {

    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    // API pública gratuita do Remotive — não precisa de chave
    private static final String REMOTIVE_API = "https://remotive.com/api/remote-jobs";
    private static final List<String> CATEGORIES = List.of(
        "software-dev", "data"
    );
    private static final List<String> RELEVANT_TERMS = List.of(
        "java", "python", "react", "node", "fullstack", "backend", "data science",
        "machine learning", "junior", "jr", "pleno", "mid-level"
    );

    @Override
    public List<JobDTO> scrape() {
        List<JobDTO> jobs = new ArrayList<>();

        for (String category : CATEGORIES) {
            try {
                List<JobDTO> categoryJobs = scrapeCategory(category);
                jobs.addAll(categoryJobs);
                log.info("Remotive: {} vagas em '{}'", categoryJobs.size(), category);
                Thread.sleep(1500);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            } catch (Exception e) {
                log.error("Remotive: erro na categoria '{}': {}", category, e.getMessage());
            }
        }

        return filterRelevant(jobs);
    }

    private List<JobDTO> scrapeCategory(String category) {
        List<JobDTO> jobs = new ArrayList<>();

        try {
            String response = webClient.get()
                .uri(uriBuilder -> uriBuilder
                    .scheme("https")
                    .host("remotive.com")
                    .path("/api/remote-jobs")
                    .queryParam("category", category)
                    .queryParam("limit", 100)
                    .build())
                .header("User-Agent", "Mozilla/5.0 (compatible; JIS/1.0)")
                .retrieve()
                .bodyToMono(String.class)
                .block();

            if (response == null) return jobs;

            JsonNode root = objectMapper.readTree(response);
            JsonNode jobsNode = root.path("jobs");

            if (jobsNode.isArray()) {
                for (JsonNode node : jobsNode) {
                    try {
                        JobDTO job = parseRemotiveJob(node);
                        if (job != null) jobs.add(job);
                    } catch (Exception e) {
                        log.warn("Remotive: erro ao parsear vaga: {}", e.getMessage());
                    }
                }
            }
        } catch (Exception e) {
            log.error("Remotive: erro na requisicao para '{}': {}", category, e.getMessage());
        }

        return jobs;
    }

    private JobDTO parseRemotiveJob(JsonNode node) {
        String id = node.path("id").asText();
        String title = node.path("title").asText();
        String company = node.path("company_name").asText("Empresa");
        String link = node.path("url").asText();

        if (id.isEmpty() || title.isEmpty() || link.isEmpty()) return null;

        String description = node.path("description").asText("");
        // Remove tags HTML da descrição para reduzir tamanho
        description = description.replaceAll("<[^>]+>", " ").replaceAll("\\s+", " ").trim();
        if (description.length() > 3000) description = description.substring(0, 3000) + "...";

        // Extrai tecnologias dos tags
        List<String> techs = new ArrayList<>();
        JsonNode tagsNode = node.path("tags");
        if (tagsNode.isArray()) {
            for (JsonNode tag : tagsNode) {
                techs.add(tag.asText());
            }
        }

        LocalDateTime publishedAt = null;
        String publishedStr = node.path("publication_date").asText();
        if (!publishedStr.isEmpty() && !publishedStr.equals("null")) {
            try {
                publishedAt = LocalDateTime.parse(publishedStr, DateTimeFormatter.ISO_DATE_TIME);
            } catch (Exception ignored) {}
        }

        String location = node.path("candidate_required_location").asText("");
        boolean ptBrRelevant = location.isBlank()
            || location.toLowerCase().contains("worldwide")
            || location.toLowerCase().contains("brazil")
            || location.toLowerCase().contains("latin america")
            || location.toLowerCase().contains("latam")
            || location.toLowerCase().contains("south america");

        if (!ptBrRelevant) return null;

        return JobDTO.builder()
            .externalId("remotive-" + id)
            .title(title)
            .companyName(company)
            .description(description)
            .link(link)
            .source("remotive")
            .remote(true)
            .hybrid(false)
            .techs(techs)
            .salaryMin(parseSalaryMin(node))
            .salaryMax(parseSalaryMax(node))
            .salaryInformed(hasSalary(node))
            .location("Remoto")
            .publishedAt(publishedAt)
            .build();
    }

    private List<JobDTO> filterRelevant(List<JobDTO> jobs) {
        return jobs.stream()
            .filter(job -> {
                String content = (job.getTitle() + " " + job.getDescription()).toLowerCase();
                return RELEVANT_TERMS.stream().anyMatch(content::contains);
            })
            .toList();
    }

    private Integer parseSalaryMin(JsonNode node) {
        String salary = node.path("salary").asText("");
        if (salary.isBlank()) return null;
        try {
            String digits = salary.replaceAll("[^0-9]", "");
            if (!digits.isEmpty()) return Integer.parseInt(digits.substring(0, Math.min(digits.length(), 7)));
        } catch (NumberFormatException ignored) {}
        return null;
    }

    private Integer parseSalaryMax(JsonNode node) {
        return null; // Remotive geralmente informa apenas faixa textual
    }

    private boolean hasSalary(JsonNode node) {
        String salary = node.path("salary").asText("");
        return !salary.isBlank();
    }

    @Override
    public String getSourceName() {
        return "remotive";
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
