package kz.edutrack.web.controller;

import kz.edutrack.application.dto.AuditLogDto;
import kz.edutrack.domain.model.audit.AuditAction;
import kz.edutrack.domain.model.audit.AuditLog;
import kz.edutrack.domain.port.in.GetAuditLogsUseCase;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/audit")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AuditController {

    private final GetAuditLogsUseCase getAuditLogs;

    @GetMapping
    public Page<AuditLogDto> getAll(@PageableDefault(size = 20, sort = "occurredAt") Pageable pageable) {
        return getAuditLogs.getAll(pageable).map(this::toDto);
    }

    @GetMapping("/actor/{actorId}")
    public Page<AuditLogDto> byActor(@PathVariable UUID actorId,
                                     @PageableDefault(size = 20) Pageable pageable) {
        return getAuditLogs.getByActor(actorId, pageable).map(this::toDto);
    }

    @GetMapping("/action/{action}")
    public Page<AuditLogDto> byAction(@PathVariable AuditAction action,
                                      @PageableDefault(size = 20) Pageable pageable) {
        return getAuditLogs.getByAction(action, pageable).map(this::toDto);
    }

    @GetMapping("/range")
    public Page<AuditLogDto> byDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @PageableDefault(size = 20) Pageable pageable) {
        return getAuditLogs.getByDateRange(from, to, pageable).map(this::toDto);
    }

    private AuditLogDto toDto(AuditLog log) {
        return new AuditLogDto(
                log.getId(), log.getAction(), log.getActorId(), log.getActorEmail(),
                log.getTargetId(), log.getTargetType(), log.getMetadata(), log.getOccurredAt()
        );
    }
}
