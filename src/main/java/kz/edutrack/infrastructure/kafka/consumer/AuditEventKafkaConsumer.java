package kz.edutrack.infrastructure.kafka.consumer;

import kz.edutrack.domain.model.audit.AuditLog;
import kz.edutrack.domain.port.out.AuditLogRepositoryPort;
import kz.edutrack.infrastructure.kafka.KafkaTopicConfig;
import kz.edutrack.infrastructure.kafka.event.AuditEventMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class AuditEventKafkaConsumer {

    private final AuditLogRepositoryPort auditLogRepository;

    @KafkaListener(
            topics = KafkaTopicConfig.AUDIT_EVENTS_TOPIC,
            groupId = "${spring.kafka.consumer.group-id}",
            containerFactory = "auditKafkaListenerContainerFactory"
    )
    public void consume(AuditEventMessage message) {
        try {
            AuditLog log = AuditLog.builder()
                    .id(message.getEventId())
                    .action(message.getAction())
                    .actorId(message.getActorId())
                    .actorEmail(message.getActorEmail())
                    .targetId(message.getTargetId())
                    .targetType(message.getTargetType())
                    .metadata(message.getMetadata())
                    .occurredAt(message.getOccurredAt())
                    .build();
            auditLogRepository.save(log);
        } catch (Exception e) {
            log.error("Failed to persist audit event {}: {}", message.getEventId(), e.getMessage(), e);
        }
    }
}
