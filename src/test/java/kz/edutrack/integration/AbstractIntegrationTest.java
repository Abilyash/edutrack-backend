package kz.edutrack.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import kz.edutrack.domain.port.out.MaterialStoragePort;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.kafka.KafkaContainer;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Testcontainers
public abstract class AbstractIntegrationTest {

    // Static containers → started once, shared across all subclasses in the same JVM run
    @Container
    static final PostgreSQLContainer<?> POSTGRES =
            new PostgreSQLContainer<>("postgres:16-alpine");

    @Container
    static final KafkaContainer KAFKA =
            new KafkaContainer("apache/kafka:3.8.0");

    @Container
    static final GenericContainer<?> REDIS =
            new GenericContainer<>("redis:7-alpine").withExposedPorts(6379);

    @DynamicPropertySource
    static void overrideProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url",          POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username",     POSTGRES::getUsername);
        registry.add("spring.datasource.password",     POSTGRES::getPassword);
        registry.add("spring.kafka.bootstrap-servers", KAFKA::getBootstrapServers);
        registry.add("spring.data.redis.host",         REDIS::getHost);
        registry.add("spring.data.redis.port",
                () -> String.valueOf(REDIS.getMappedPort(6379)));
    }

    // Prevents Spring from fetching real JWKS on startup
    @MockitoBean
    JwtDecoder jwtDecoder;

    // Prevents real Supabase Storage calls in tests
    @MockitoBean
    MaterialStoragePort materialStoragePort;

    @Autowired
    protected MockMvc mockMvc;

    @Autowired
    protected ObjectMapper objectMapper;
}
