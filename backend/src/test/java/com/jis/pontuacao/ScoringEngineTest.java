package com.jis.pontuacao;

import com.jis.transferencia.ScoreResultDTO;
import com.jis.modelo.Job;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("ScoringEngine - Testes Unitarios")
class ScoringEngineTest {

    private ScoringEngine scoringEngine;

    @BeforeEach
    void setUp() {
        scoringEngine = new ScoringEngine();
    }

    @Test
    @DisplayName("Vaga Java remota com salario deve ter score alto")
    void shouldGiveHighScoreForJavaRemoteJobWithSalary() {
        Job job = Job.builder()
            .title("Desenvolvedor Java Junior")
            .description("Experiencia com Java, Spring Boot, PostgreSQL, API REST")
            .remote(true)
            .hybrid(false)
            .salaryInformed(true)
            .techs(List.of("Java", "Spring Boot", "PostgreSQL"))
            .publishedAt(LocalDateTime.now().minusDays(1))
            .build();

        ScoreResultDTO result = scoringEngine.calculate(job);

        assertThat(result.getScoreRules()).isGreaterThan(7.0);
        assertThat(result.getBreakdown()).containsKey("techs");
        assertThat(result.getBreakdown()).containsKey("work_mode");
        assertThat(result.getBreakdown()).containsKey("salary");
    }

    @Test
    @DisplayName("Vaga .NET presencial fora de Bauru deve ter score baixo")
    void shouldGiveLowScoreForDotNetOfficeOutsideBauru() {
        Job job = Job.builder()
            .title("Desenvolvedor .NET Senior")
            .description("Experiencia com C#, .NET, Azure, Kubernetes obrigatorio")
            .remote(false)
            .hybrid(false)
            .location("São Paulo, SP")
            .salaryInformed(false)
            .techs(List.of(".NET", "C#"))
            .publishedAt(LocalDateTime.now().minusDays(60))
            .build();

        ScoreResultDTO result = scoringEngine.calculate(job);

        assertThat(result.getScoreRules()).isLessThan(3.0);
    }

    @Test
    @DisplayName("Vaga Python com ML deve ter score extra")
    void shouldGiveExtraScoreForPythonMLJob() {
        Job job = Job.builder()
            .title("Data Science Junior")
            .description("Python, Machine Learning, scikit-learn, NLP, pandas")
            .remote(true)
            .salaryInformed(true)
            .techs(List.of("Python", "scikit-learn", "NLP"))
            .publishedAt(LocalDateTime.now())
            .build();

        ScoreResultDTO result = scoringEngine.calculate(job);

        assertThat(result.getScoreRules()).isGreaterThan(8.0);
        assertThat(result.getBreakdown().get("techs")).isGreaterThan(5.0);
    }

    @Test
    @DisplayName("Salario informado adiciona pontos ao score")
    void shouldAddPointsWhenSalaryIsInformed() {
        Job jobWithSalary = Job.builder()
            .title("Dev Java Junior")
            .description("Java Spring Boot")
            .remote(true)
            .salaryInformed(true)
            .publishedAt(LocalDateTime.now())
            .build();

        Job jobWithoutSalary = Job.builder()
            .title("Dev Java Junior")
            .description("Java Spring Boot")
            .remote(true)
            .salaryInformed(false)
            .publishedAt(LocalDateTime.now())
            .build();

        ScoreResultDTO withSalary = scoringEngine.calculate(jobWithSalary);
        ScoreResultDTO withoutSalary = scoringEngine.calculate(jobWithoutSalary);

        assertThat(withSalary.getScoreRules()).isGreaterThan(withoutSalary.getScoreRules());
        assertThat(withSalary.getBreakdown().get("salary")).isEqualTo(2.0);
        assertThat(withoutSalary.getBreakdown().get("salary")).isEqualTo(0.0);
    }

    @Test
    @DisplayName("Vaga nova (menos de 24h) recebe bonus de timing")
    void shouldGiveTimingBonusForFreshJob() {
        Job freshJob = Job.builder()
            .title("Dev Java Junior")
            .description("Java")
            .remote(true)
            .salaryInformed(false)
            .publishedAt(LocalDateTime.now().minusHours(2))
            .build();

        Job oldJob = Job.builder()
            .title("Dev Java Junior")
            .description("Java")
            .remote(true)
            .salaryInformed(false)
            .publishedAt(LocalDateTime.now().minusDays(45))
            .build();

        ScoreResultDTO freshResult = scoringEngine.calculate(freshJob);
        ScoreResultDTO oldResult = scoringEngine.calculate(oldJob);

        assertThat(freshResult.getBreakdown().get("timing"))
            .isGreaterThan(oldResult.getBreakdown().get("timing"));
    }

    @Test
    @DisplayName("Vaga remota recebe mais pontos que hibrida")
    void shouldGiveMorePointsForRemoteThanHybrid() {
        Job remoteJob = Job.builder()
            .title("Dev Java Junior")
            .description("Java")
            .remote(true)
            .hybrid(false)
            .salaryInformed(false)
            .publishedAt(LocalDateTime.now())
            .build();

        Job hybridJob = Job.builder()
            .title("Dev Java Junior")
            .description("Java")
            .remote(false)
            .hybrid(true)
            .salaryInformed(false)
            .publishedAt(LocalDateTime.now())
            .build();

        ScoreResultDTO remoteResult = scoringEngine.calculate(remoteJob);
        ScoreResultDTO hybridResult = scoringEngine.calculate(hybridJob);

        assertThat(remoteResult.getBreakdown().get("work_mode"))
            .isGreaterThan(hybridResult.getBreakdown().get("work_mode"));
    }

    @Test
    @DisplayName("Vaga presencial em Sao Paulo penaliza score")
    void shouldPenalizePresentialJobOutsideBauru() {
        Job job = Job.builder()
            .title("Dev Java Junior")
            .description("Java Spring Boot")
            .remote(false)
            .hybrid(false)
            .location("São Paulo, SP")
            .salaryInformed(false)
            .publishedAt(LocalDateTime.now())
            .build();

        ScoreResultDTO result = scoringEngine.calculate(job);

        assertThat(result.getBreakdown().get("work_mode")).isEqualTo(-3.0);
    }

    @Test
    @DisplayName("Vaga presencial em Bauru nao penaliza")
    void shouldNotPenalizePresentialJobInBauru() {
        Job job = Job.builder()
            .title("Dev Java Junior")
            .description("Java")
            .remote(false)
            .hybrid(false)
            .location("Bauru, SP")
            .salaryInformed(false)
            .publishedAt(LocalDateTime.now())
            .build();

        ScoreResultDTO result = scoringEngine.calculate(job);

        assertThat(result.getBreakdown().get("work_mode")).isEqualTo(0.0);
    }

    @ParameterizedTest
    @ValueSource(strings = {"junior", "jr", "júnior", "entry level", "Junior"})
    @DisplayName("Deve reconhecer variacoes de nivel junior")
    void shouldRecognizeJuniorLevelVariations(String levelTerm) {
        Job job = Job.builder()
            .title("Desenvolvedor " + levelTerm)
            .description("Vaga para " + levelTerm)
            .remote(true)
            .salaryInformed(false)
            .publishedAt(LocalDateTime.now())
            .build();

        ScoreResultDTO result = scoringEngine.calculate(job);

        assertThat(result.getBreakdown().get("level")).isGreaterThanOrEqualTo(0.0);
    }

    @ParameterizedTest
    @ValueSource(strings = {"senior", "sênior", "sr", "especialista"})
    @DisplayName("Deve penalizar variacoes de nivel senior")
    void shouldPenalizeSeniorLevelVariations(String levelTerm) {
        Job job = Job.builder()
            .title("Desenvolvedor " + levelTerm)
            .description("Vaga para " + levelTerm)
            .remote(true)
            .salaryInformed(false)
            .publishedAt(LocalDateTime.now())
            .build();

        ScoreResultDTO result = scoringEngine.calculate(job);

        assertThat(result.getBreakdown().get("level")).isLessThan(0.0);
    }

    @Test
    @DisplayName("Score final nunca deve ser negativo")
    void scoreShouldNeverBeNegative() {
        Job worstCase = Job.builder()
            .title("Arquiteto .NET Sênior")
            .description("C#, .NET, Kubernetes obrigatorio, Kafka, TOTVS AGRO")
            .remote(false)
            .hybrid(false)
            .location("Curitiba, PR")
            .salaryInformed(false)
            .techs(List.of(".NET", "C#", "Kubernetes"))
            .publishedAt(LocalDateTime.now().minusDays(90))
            .build();

        ScoreResultDTO result = scoringEngine.calculate(worstCase);

        assertThat(result.getScoreRules()).isGreaterThanOrEqualTo(0.0);
    }

    @Test
    @DisplayName("calculateFinalScore combina corretamente regras ML e empresa")
    void shouldCalculateFinalScoreCorrectly() {
        double scoreRules = 10.0;
        double scoreMl = 8.0;
        double scoreCompany = 6.0;

        double finalScore = scoringEngine.calculateFinalScore(scoreRules, scoreMl, scoreCompany);

        // 10*0.5 + 8*0.3 + 6*0.2 = 5 + 2.4 + 1.2 = 8.6
        assertThat(finalScore).isEqualTo(8.6);
    }

    @Test
    @DisplayName("Breakdown deve conter todas as chaves esperadas")
    void breakdownShouldContainAllExpectedKeys() {
        Job job = Job.builder()
            .title("Dev Java Junior")
            .description("Java Spring Boot")
            .remote(true)
            .salaryInformed(true)
            .publishedAt(LocalDateTime.now())
            .build();

        ScoreResultDTO result = scoringEngine.calculate(job);

        assertThat(result.getBreakdown())
            .containsKeys("techs", "level", "work_mode", "salary", "timing", "senior_penalty");
    }
}
