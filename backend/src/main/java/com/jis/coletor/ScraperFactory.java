package com.jis.coletor;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class ScraperFactory {

    private final List<ScraperStrategy> scrapers;

    public ScraperStrategy getScraper(String sourceName) {
        return scrapers.stream()
            .filter(s -> s.getSourceName().equals(sourceName))
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException("Scraper nao encontrado: " + sourceName));
    }

    public List<ScraperStrategy> getAllEnabled() {
        return scrapers.stream()
            .filter(ScraperStrategy::isEnabled)
            .collect(Collectors.toList());
    }

    public List<String> getAvailableSources() {
        return scrapers.stream()
            .map(ScraperStrategy::getSourceName)
            .collect(Collectors.toList());
    }
}
