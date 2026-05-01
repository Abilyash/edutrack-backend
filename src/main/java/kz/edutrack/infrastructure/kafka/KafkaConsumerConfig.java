package kz.edutrack.infrastructure.kafka;

import kz.edutrack.infrastructure.kafka.event.AuditEventMessage;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.springframework.boot.autoconfigure.kafka.KafkaProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.DefaultKafkaConsumerFactory;
import org.springframework.kafka.support.serializer.JsonDeserializer;

import java.util.Map;

@Configuration
public class KafkaConsumerConfig {

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, AuditEventMessage>
    auditKafkaListenerContainerFactory(KafkaProperties kafkaProperties) {

        Map<String, Object> props = kafkaProperties.buildConsumerProperties(null);
        props.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, JsonDeserializer.class);

        var consumerFactory = new DefaultKafkaConsumerFactory<>(
                props,
                new StringDeserializer(),
                new JsonDeserializer<>(AuditEventMessage.class, false)
        );

        var factory = new ConcurrentKafkaListenerContainerFactory<String, AuditEventMessage>();
        factory.setConsumerFactory(consumerFactory);
        return factory;
    }
}
