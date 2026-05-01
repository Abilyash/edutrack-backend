package kz.edutrack.infrastructure.supabase.storage;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
@EnableConfigurationProperties(SupabaseProperties.class)
public class SupabaseStorageConfig {

    @Bean
    public RestClient supabaseStorageClient(SupabaseProperties props) {
        return RestClient.builder()
                .baseUrl(props.url())
                .defaultHeader("Authorization", "Bearer " + props.serviceRoleKey())
                .defaultHeader("apikey", props.serviceRoleKey())
                .build();
    }
}
