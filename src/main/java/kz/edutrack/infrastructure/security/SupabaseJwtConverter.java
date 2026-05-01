package kz.edutrack.infrastructure.security;

import kz.edutrack.domain.model.user.Role;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.List;
import java.util.Map;

/**
 * Извлекает роль из Supabase JWT claim: app_metadata.role
 * Пример payload: { "app_metadata": { "role": "TEACHER" } }
 */
@Component
public class SupabaseJwtConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        Role role = extractRole(jwt);
        Collection<SimpleGrantedAuthority> authorities =
                List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));

        return new JwtAuthenticationToken(jwt, authorities, jwt.getSubject());
    }

    private Role extractRole(Jwt jwt) {
        Map<String, Object> appMeta = jwt.getClaimAsMap("app_metadata");
        if (appMeta == null) return Role.STUDENT;

        Object rawRole = appMeta.get("role");
        if (rawRole == null) return Role.STUDENT;

        try {
            return Role.valueOf(rawRole.toString().toUpperCase());
        } catch (IllegalArgumentException e) {
            return Role.STUDENT;
        }
    }
}
