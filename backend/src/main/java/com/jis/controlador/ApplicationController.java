package com.jis.controlador;

import com.jis.servico.ApplicationService;
import com.jis.transferencia.ApplicationDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/applications")
@RequiredArgsConstructor
@Tag(name = "Applications", description = "Controle de candidaturas")
@CrossOrigin(origins = "*")
public class ApplicationController {

    private final ApplicationService applicationService;

    @PostMapping("/job/{jobId}")
    @Operation(summary = "Registra candidatura para uma vaga")
    public ResponseEntity<ApplicationDTO> apply(@PathVariable Long jobId,
                                                @RequestBody(required = false) Map<String, String> body) {
        return ResponseEntity.ok(
            applicationService.apply(jobId, body != null ? body.get("notes") : null)
        );
    }

    @PutMapping("/{id}/stage")
    @Operation(summary = "Atualiza estagio da candidatura")
    public ResponseEntity<ApplicationDTO> updateStage(@PathVariable Long id,
                                                      @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(applicationService.updateStage(id, body.get("stage")));
    }

    @GetMapping
    @Operation(summary = "Lista todas as candidaturas")
    public ResponseEntity<List<ApplicationDTO>> getAll() {
        return ResponseEntity.ok(applicationService.getAll());
    }

    @GetMapping("/stage/{stage}")
    @Operation(summary = "Lista candidaturas por estagio")
    public ResponseEntity<List<ApplicationDTO>> getByStage(@PathVariable String stage) {
        return ResponseEntity.ok(applicationService.getByStage(stage));
    }
}
