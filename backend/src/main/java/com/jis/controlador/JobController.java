package com.jis.controlador;

import com.jis.transferencia.JobResponseDTO;
import com.jis.servico.CollectorService;
import com.jis.servico.JobService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/jobs")
@RequiredArgsConstructor
@Tag(name = "Jobs", description = "Endpoints de vagas")
@CrossOrigin(origins = "*")
public class JobController {

    private final JobService jobService;
    private final CollectorService collectorService;

    @GetMapping
    @Operation(summary = "Lista todas as vagas ativas")
    public ResponseEntity<List<JobResponseDTO>> getAllJobs() {
        return ResponseEntity.ok(jobService.getAllJobs());
    }

    @GetMapping("/top")
    @Operation(summary = "Top vagas por score")
    public ResponseEntity<List<JobResponseDTO>> getTopJobs(
            @RequestParam(defaultValue = "20") int limit) {
        return ResponseEntity.ok(jobService.getTopJobs(limit));
    }

    @PostMapping("/collect")
    @Operation(summary = "Dispara coleta manual de vagas")
    public ResponseEntity<Map<String, Object>> triggerCollection() {
        CollectorService.CollectionResult result = collectorService.collectAll();
        return ResponseEntity.ok(Map.of(
            "totalAnalyzed", result.totalAnalyzed(),
            "newJobs", result.newJobs(),
            "scrapersRun", result.scrapersRun(),
            "errors", result.errors()
        ));
    }

    @GetMapping("/count/today")
    @Operation(summary = "Contagem de vagas coletadas hoje")
    public ResponseEntity<Map<String, Long>> countToday() {
        return ResponseEntity.ok(Map.of("count", jobService.countTodayJobs()));
    }
}
