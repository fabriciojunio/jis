package com.jis.servico;

import com.jis.modelo.Job;
import com.jis.modelo.JobScore;
import com.jis.repositorio.JobScoreRepository;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final JobScoreRepository jobScoreRepository;
    private final MetricsService metricsService;
    private final JavaMailSender mailSender;

    @Value("${notification.email.enabled:false}")
    private boolean emailEnabled;

    @Value("${notification.email.recipient:}")
    private String recipient;

    @Value("${notification.email.from:noreply@jis.app}")
    private String from;

    private static final int MAX_NOTIFICATIONS = 20;

    @Transactional
    public int notifyTopJobs() {
        if (!emailEnabled || recipient == null || recipient.isBlank()) {
            log.warn("Email nao configurado. Defina notification.email.enabled=true e notification.email.recipient");
            return 0;
        }

        List<JobScore> topJobs = jobScoreRepository.findTopUnnotified(MAX_NOTIFICATIONS);

        if (topJobs.isEmpty()) {
            log.info("Nenhuma vaga nova para notificar");
            return 0;
        }

        try {
            sendEmailReport(topJobs);

            for (JobScore score : topJobs) {
                score.setNotified(true);
                jobScoreRepository.save(score);
            }

            metricsService.incrementJobsNotified(topJobs.size());
            log.info("{} vagas notificadas por email para {}", topJobs.size(), recipient);
            return topJobs.size();

        } catch (Exception e) {
            log.error("Erro ao enviar email de notificacao: {}", e.getMessage(), e);
            return 0;
        }
    }

    private void sendEmailReport(List<JobScore> jobs) throws Exception {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setFrom(from);
        helper.setTo(recipient);
        helper.setSubject(buildSubject(jobs.size()));
        helper.setText(buildHtmlBody(jobs), true);

        mailSender.send(message);
    }

    private String buildSubject(int count) {
        String today = LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
        return String.format("JIS - %d Vagas Qualificadas para Voce | %s", count, today);
    }

    private String buildHtmlBody(List<JobScore> jobs) {
        StringBuilder html = new StringBuilder();

        html.append("""
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>JIS - Vagas do Dia</title>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                       background: #f5f5f5; margin: 0; padding: 20px; color: #333; }
                .container { max-width: 700px; margin: 0 auto; background: white;
                             border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
                .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                          color: white; padding: 30px; text-align: center; }
                .header h1 { margin: 0 0 8px; font-size: 26px; letter-spacing: 1px; }
                .header p { margin: 0; opacity: 0.8; font-size: 14px; }
                .stats { display: flex; background: #0f3460; padding: 16px 30px; gap: 20px; }
                .stat { flex: 1; text-align: center; color: white; }
                .stat-value { font-size: 24px; font-weight: 700; }
                .stat-label { font-size: 11px; opacity: 0.7; text-transform: uppercase; letter-spacing: 1px; }
                .jobs { padding: 20px; }
                .job-card { background: #fafafa; border: 1px solid #e8e8e8; border-radius: 10px;
                            padding: 20px; margin-bottom: 16px; position: relative;
                            border-left: 4px solid #0f3460; }
                .job-card:hover { border-left-color: #e94560; }
                .score-badge { position: absolute; top: 16px; right: 16px; background: #0f3460;
                               color: white; border-radius: 20px; padding: 4px 12px; font-size: 13px;
                               font-weight: 700; }
                .score-high { background: #28a745; }
                .score-mid  { background: #fd7e14; }
                .job-title { font-size: 17px; font-weight: 700; color: #1a1a2e; margin: 0 0 4px;
                             padding-right: 80px; }
                .job-company { font-size: 14px; color: #666; margin: 0 0 12px; }
                .job-details { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 14px; }
                .tag { background: #e8f0fe; color: #1a73e8; border-radius: 14px; padding: 3px 10px;
                       font-size: 12px; font-weight: 500; }
                .tag-remote { background: #e6f4ea; color: #188038; }
                .tag-salary { background: #fef7e0; color: #b06000; }
                .tag-score  { background: #fce8e6; color: #c5221f; font-size: 11px; }
                .apply-btn { display: inline-block; background: #e94560; color: white !important;
                             text-decoration: none; border-radius: 8px; padding: 10px 24px;
                             font-size: 14px; font-weight: 600; }
                .footer { text-align: center; padding: 24px; color: #999; font-size: 12px;
                          border-top: 1px solid #f0f0f0; }
                a { color: #0f3460; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>JIS — Job Intelligence System</h1>
                  <p>Vagas do Dia &nbsp;·&nbsp; """);

        html.append(LocalDate.now().format(DateTimeFormatter.ofPattern("dd 'de' MMMM 'de' yyyy", java.util.Locale.of("pt", "BR"))));
        html.append(" &nbsp;·&nbsp; 19:00</p></div>");

        // Stats bar
        html.append("<div class=\"stats\">");
        html.append("<div class=\"stat\"><div class=\"stat-value\">").append(jobs.size()).append("</div><div class=\"stat-label\">vagas qualificadas</div></div>");
        jobs.stream().mapToDouble(j -> j.getFinalScore() != null ? j.getFinalScore() : 0.0).average().ifPresent(avg ->
            html.append("<div class=\"stat\"><div class=\"stat-value\">").append(String.format("%.1f", avg)).append("</div><div class=\"stat-label\">score médio</div></div>")
        );
        long remotas = jobs.stream().filter(j -> Boolean.TRUE.equals(j.getJob().getRemote())).count();
        html.append("<div class=\"stat\"><div class=\"stat-value\">").append(remotas).append("</div><div class=\"stat-label\">vagas remotas</div></div>");
        html.append("</div>");

        html.append("<div class=\"jobs\">");

        for (int i = 0; i < jobs.size(); i++) {
            JobScore score = jobs.get(i);
            Job job = score.getJob();
            appendJobCard(html, job, score, i + 1);
        }

        html.append("</div>");
        html.append("""
                <div class="footer">
                  <p>Gerado automaticamente pelo <strong>JIS</strong> — Job Intelligence System</p>
                  <p>Para parar de receber, altere a configuração <code>notification.email.enabled=false</code></p>
                </div>
              </div>
            </body>
            </html>
            """);

        return html.toString();
    }

    private void appendJobCard(StringBuilder html, Job job, JobScore score, int rank) {
        double finalScore = score.getFinalScore() != null ? score.getFinalScore() : 0.0;
        String scoreClass = finalScore >= 8 ? "score-badge score-high"
                          : finalScore >= 6 ? "score-badge score-mid"
                          : "score-badge";

        html.append("<div class=\"job-card\">");
        html.append("<span class=\"").append(scoreClass).append("\">")
            .append(String.format("#%d  %.1f", rank, finalScore))
            .append("</span>");

        html.append("<div class=\"job-title\">").append(escape(job.getTitle())).append("</div>");
        html.append("<div class=\"job-company\">").append(escape(job.getCompanyName() != null ? job.getCompanyName() : "Empresa")).append("</div>");

        html.append("<div class=\"job-details\">");
        if (Boolean.TRUE.equals(job.getRemote())) html.append("<span class=\"tag tag-remote\">Remoto</span>");
        else if (Boolean.TRUE.equals(job.getHybrid())) html.append("<span class=\"tag tag-remote\">Híbrido</span>");
        else html.append("<span class=\"tag\">Presencial</span>");

        if (job.getLevel() != null && !job.getLevel().isBlank())
            html.append("<span class=\"tag\">").append(escape(job.getLevel())).append("</span>");

        if (Boolean.TRUE.equals(job.getSalaryInformed()) && job.getSalaryMin() != null && job.getSalaryMax() != null)
            html.append("<span class=\"tag tag-salary\">R$ ").append(String.format("%,d – %,d", job.getSalaryMin(), job.getSalaryMax())).append("</span>");
        else if (Boolean.TRUE.equals(job.getSalaryInformed()))
            html.append("<span class=\"tag tag-salary\">Salário informado</span>");

        if (job.getTechs() != null) {
            job.getTechs().stream().limit(5).forEach(t ->
                html.append("<span class=\"tag\">").append(escape(t)).append("</span>")
            );
        }

        if (score.getScoreMl() != null && score.getScoreMl() > 0) {
            html.append("<span class=\"tag tag-score\">")
                .append(String.format("%.0f%% callback", score.getScoreMl() * 100))
                .append("</span>");
        }

        html.append("</div>");
        html.append("<a class=\"apply-btn\" href=\"").append(job.getLink()).append("\" target=\"_blank\">Ver Vaga</a>");
        html.append("</div>");
    }

    private String escape(String text) {
        if (text == null) return "";
        return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }
}
