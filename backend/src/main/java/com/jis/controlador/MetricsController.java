package com.jis.controlador;

import com.jis.transferencia.MetricsDTO;
import com.jis.servico.MetricsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/metrics")
@RequiredArgsConstructor
@Tag(name = "Metrics", description = "Metricas do sistema")
@CrossOrigin(origins = "*")
public class MetricsController {

    private final MetricsService metricsService;

    @GetMapping("/today")
    @Operation(summary = "Metricas de hoje")
    public ResponseEntity<MetricsDTO> getToday() {
        return ResponseEntity.ok(metricsService.getTodayDTO());
    }

    @GetMapping("/last30days")
    @Operation(summary = "Metricas dos ultimos 30 dias")
    public ResponseEntity<List<MetricsDTO>> getLast30Days() {
        return ResponseEntity.ok(metricsService.getLast30Days());
    }

    @GetMapping("/callback-rate")
    @Operation(summary = "Taxa de callback geral")
    public ResponseEntity<Map<String, Double>> getCallbackRate() {
        return ResponseEntity.ok(Map.of("callbackRate", metricsService.getCallbackRate()));
    }
}
