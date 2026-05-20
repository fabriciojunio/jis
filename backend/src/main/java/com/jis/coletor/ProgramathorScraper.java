package com.jis.coletor;

import com.jis.transferencia.JobDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class ProgramathorScraper implements ScraperStrategy {

    private static final String BASE_URL = "https://programathor.com.br";
    private static final List<String> SEARCH_PATHS = List.of(
        "/jobs/java",
        "/jobs/python",
        "/jobs/react",
        "/jobs/node-js",
        "/jobs/fullstack"
    );

    @Override
    public List<JobDTO> scrape() {
        List<JobDTO> jobs = new ArrayList<>();

        for (String path : SEARCH_PATHS) {
            try {
                Document doc = Jsoup.connect(BASE_URL + path)
                    .userAgent("Mozilla/5.0 (compatible; JIS/1.0)")
                    .timeout(10000)
                    .get();

                Elements jobElements = doc.select(".stream-job-card");
                for (Element el : jobElements) {
                    try {
                        JobDTO job = parseProgramathorJob(el);
                        if (job != null) jobs.add(job);
                    } catch (Exception e) {
                        log.warn("Programathor: erro ao parsear elemento: {}", e.getMessage());
                    }
                }

                log.info("Programathor: {} vagas em {}", jobElements.size(), path);
                Thread.sleep(2000);
            } catch (Exception e) {
                log.error("Programathor: erro em {}: {}", path, e.getMessage());
            }
        }

        return jobs;
    }

    private JobDTO parseProgramathorJob(Element el) {
        String link = el.select("a").attr("href");
        String title = el.select(".stream-job-card__title").text();
        String company = el.select(".stream-job-card__company").text();

        if (title.isEmpty()) return null;

        String id = link.replaceAll("[^0-9]", "");
        if (id.isEmpty()) id = String.valueOf(title.hashCode());

        boolean remote = el.text().toLowerCase().contains("remoto") ||
                         el.text().toLowerCase().contains("remote");

        List<String> techs = new ArrayList<>();
        Elements techEls = el.select(".stream-job-card__badge");
        for (Element tech : techEls) {
            techs.add(tech.text());
        }

        return JobDTO.builder()
            .externalId("programathor-" + id)
            .title(title)
            .companyName(company)
            .description(el.text())
            .link(BASE_URL + link)
            .source("programathor")
            .remote(remote)
            .hybrid(false)
            .techs(techs)
            .salaryInformed(false)
            .publishedAt(LocalDateTime.now())
            .build();
    }

    @Override
    public String getSourceName() {
        return "programathor";
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
