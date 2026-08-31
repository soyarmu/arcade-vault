# Audit Log — Arcade Vault Security

Bitácora de auditorías de seguridad. Una entrada por corrida, orden cronológico descendente.

---

## Auditoría 2026-05-26

**Commit:** `4c550b8`
**Resumen:** 🔴 0 · 🟠 1 · 🟡 2 · 🔵 3

### Críticos

- ninguno

### Altos

- [DB / pg_policies] Tabla `games` tiene dos políticas SELECT redundantes: `public_read_games` y `public_select_games` (ambas `USING (true)`, roles anon+authenticated). Solo debe existir una. La duplicación no rompe seguridad pero aumenta superficie de confusión y puede enmascarar cambios futuros. Remediación: DROP POLICY "public_select_games" ON public.games.

### Medios

- [DB / Supabase Advisor] Leaked Password Protection deshabilitado — HaveIBeenPwned check OFF. Remediación: Authentication → Settings → Enable Leaked Password Protection.
- [DB / pg_policies] Tabla `scores` tiene dos políticas SELECT redundantes: `public_read_scores` y `public_select_scores` (ambas `USING (true)`, roles anon+authenticated). Misma situación que en `games`. Remediación: DROP POLICY "public_select_scores" ON public.scores.

### Info / Checks manuales

- [ ] Authentication → Settings → Minimum password length ≥ 8 (no verificable via MCP).
- [ ] Authentication → Settings → Leaked Password Protection = ON (advisor activo confirma que está OFF — acción requerida).
- [ ] Authentication → Settings → Max signup rate por IP configurado (no verificable via MCP).

### Delta vs anterior

- Nuevos: primera auditoría, sin referencia previa.
- Resueltos: N/A.

---
