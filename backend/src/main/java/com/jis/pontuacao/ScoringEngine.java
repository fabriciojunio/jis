package com.jis.pontuacao;

import com.jis.transferencia.ScoreResultDTO;
import com.jis.modelo.Job;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class ScoringEngine {

    // Stack principal — peso alto
    private static final Map<String, Double> TECH_SCORES = Map.ofEntries(
        Map.entry("java", 3.0),
        Map.entry("spring boot", 3.0),
        Map.entry("python", 3.0),
        Map.entry("react", 2.0),
        Map.entry("node.js", 2.0),
        Map.entry("nodejs", 2.0),
        Map.entry("fastapi", 2.0),
        Map.entry("postgresql", 2.0),
        Map.entry("sql", 1.5),
        Map.entry("javascript", 1.5),
        Map.entry("typescript", 1.5),
        Map.entry("next.js", 1.5),
        Map.entry("nextjs", 1.5),
        Map.entry("react native", 1.5),
        Map.entry("docker", 1.0),
        Map.entry("git", 0.5),
        Map.entry("machine learning", 2.0),
        Map.entry("scikit-learn", 2.0),
        Map.entry("nlp", 2.0),
        Map.entry("pandas", 1.5),
        Map.entry("xgboost", 1.5),
        Map.entry("api rest", 1.0),
        Map.entry("rest api", 1.0),
        Map.entry("supabase", 1.0)
    );

    // Stack incompatível — penaliza o score
    private static final Map<String, Double> NEGATIVE_TECH_SCORES = Map.ofEntries(
        Map.entry(".net", -3.0),
        Map.entry("c#", -3.0),
        Map.entry("kotlin", -2.5),
        Map.entry("flutter", -2.0),
        Map.entry("computer vision", -2.0),
        Map.entry("totvs agro", -3.0),
        Map.entry("cobol", -3.0),
        Map.entry("delphi", -3.0)
    );

    // Nível da vaga
    private static final Map<String, Double> LEVEL_SCORES = Map.of(
        "junior", 3.0,
        "jr", 3.0,
        "júnior", 3.0,
        "entry level", 3.0,
        "pleno", 2.0,
        "mid", 2.0,
        "senior", -3.0,
        "sênior", -3.0,
        "sr", -2.0,
        "especialista", -2.0
    );

    // Termos que indicam vaga sênior real
    private static final List<String> SENIOR_MANDATORY_TERMS = List.of(
        "kubernetes obrigatório",
        "kafka obrigatório",
        "arquiteto",
        "tech lead",
        "liderança técnica"
    );

    public ScoreResultDTO calculate(Job job) {
        Map<String, Double> breakdown = new HashMap<>();

        double techScore = calculateTechScore(job);
        breakdown.put("techs", techScore);

        double levelScore = calculateLevelScore(job);
        breakdown.put("level", levelScore);

        double workModeScore = calculateWorkModeScore(job);
        breakdown.put("work_mode", workModeScore);

        double salaryScore = job.getSalaryInformed() != null && job.getSalaryInformed() ? 2.0 : 0.0;
        breakdown.put("salary", salaryScore);

        double timingScore = calculateTimingScore(job);
        breakdown.put("timing", timingScore);

        double seniorPenalty = calculateSeniorPenalty(job);
        breakdown.put("senior_penalty", seniorPenalty);

        double scoreRules = techScore + levelScore + workModeScore + salaryScore + timingScore + seniorPenalty;
        scoreRules = Math.max(scoreRules, 0.0); // impede score negativo

        return ScoreResultDTO.builder()
                .scoreRules(round(scoreRules))
                .scoreMl(0.0) // será preenchido pelo serviço de ML
                .scoreCompany(0.0) // será preenchido pelo avaliador de empresas
                .finalScore(round(scoreRules)) // provisório até o ML responder
                .breakdown(breakdown)
                .build();
    }

    private double calculateTechScore(Job job) {
        String content = getSearchableContent(job).toLowerCase();
        double score = 0.0;

        for (Map.Entry<String, Double> entry : TECH_SCORES.entrySet()) {
            if (content.contains(entry.getKey())) {
                score += entry.getValue();
            }
        }

        for (Map.Entry<String, Double> entry : NEGATIVE_TECH_SCORES.entrySet()) {
            if (content.contains(entry.getKey())) {
                score += entry.getValue(); // valor já é negativo
            }
        }

        return score;
    }

    private double calculateLevelScore(Job job) {
        String content = (job.getTitle() + " " + job.getDescription()).toLowerCase();

        for (Map.Entry<String, Double> entry : LEVEL_SCORES.entrySet()) {
            if (content.contains(entry.getKey())) {
                return entry.getValue();
            }
        }
        return 0.0;
    }

    private double calculateWorkModeScore(Job job) {
        if (Boolean.TRUE.equals(job.getRemote())) return 3.0;
        if (Boolean.TRUE.equals(job.getHybrid())) return 1.0;

        String location = job.getLocation() != null ? job.getLocation().toLowerCase() : "";
        if (!location.isEmpty() && !location.contains("bauru")) {
            return -3.0; // presencial fora de Bauru — penaliza
        }

        return 0.0;
    }

    private double calculateTimingScore(Job job) {
        if (job.getPublishedAt() == null) return 0.0;

        long daysAgo = ChronoUnit.DAYS.between(job.getPublishedAt(), LocalDateTime.now());

        if (daysAgo <= 1) return 2.0;
        if (daysAgo <= 3) return 1.0;
        if (daysAgo > 30) return -1.0;
        return 0.0;
    }

    private double calculateSeniorPenalty(Job job) {
        String content = getSearchableContent(job).toLowerCase();
        for (String term : SENIOR_MANDATORY_TERMS) {
            if (content.contains(term.toLowerCase())) {
                return -3.0;
            }
        }
        return 0.0;
    }

    public double calculateFinalScore(double scoreRules, double scoreMl, double scoreCompany) {
        // Pontuação final: regras 50% + ML 30% + empresa 20%
        return round((scoreRules * 0.5) + (scoreMl * 0.3) + (scoreCompany * 0.2));
    }

    private String getSearchableContent(Job job) {
        StringBuilder sb = new StringBuilder();
        if (job.getTitle() != null) sb.append(job.getTitle()).append(" ");
        if (job.getDescription() != null) sb.append(job.getDescription()).append(" ");
        if (job.getTechs() != null) sb.append(String.join(" ", job.getTechs()));
        return sb.toString();
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}
