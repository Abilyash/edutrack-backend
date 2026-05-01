package kz.edutrack.infrastructure.kafka.producer;

import kz.edutrack.domain.model.audit.AuditLog;
import kz.edutrack.domain.port.out.AuditEventPublisherPort;
import kz.edutrack.infrastructure.kafka.KafkaTopicConfig;
import kz.edutrack.infrastructure.kafka.event.AuditEventMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class AuditEventKafkaProducer implements AuditEventPublisherPort {

    private final KafkaTemplate<String, AuditEventMessage> kafkaTemplate;

    @Override
    public void publish(AuditLog event) {
        AuditEventMessage message = AuditEventMessage.builder()
                .eventId(event.getId())
                .action(event.getAction())
                .actorId(event.getActorId())
                .actorEmail(event.getActorEmail())
                .targetId(event.getTargetId())
                .targetType(event.getTargetType())
                .metadata(event.getMetadata())
                .occurredAt(event.getOccurredAt())
                .build();

        kafkaTemplate.send(KafkaTopicConfig.AUDIT_EVENTS_TOPIC, event.getId().toString(), message)
                .whenComplete((result, ex) -> {
                    if (ex != null) {
                        log.error("Failed to publish audit event {}: {}", event.getId(), ex.getMessage());
                    }
                });
    }
}
