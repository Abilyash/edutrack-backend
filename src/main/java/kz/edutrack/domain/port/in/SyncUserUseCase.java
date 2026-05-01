package kz.edutrack.domain.port.in;

import kz.edutrack.domain.model.user.Role;
import kz.edutrack.domain.model.user.User;

import java.util.UUID;

/**
 * Вызывается при первом обращении к API: синхронизирует пользователя из JWT
 * с локальной БД (upsert).
 */
public interface SyncUserUseCase {
    User syncFromJwt(UUID supabaseId, String email, Role role);
}
