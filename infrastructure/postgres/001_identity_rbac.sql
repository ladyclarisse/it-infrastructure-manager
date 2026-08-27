CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  open_id VARCHAR(128) NOT NULL UNIQUE,
  name VARCHAR(255), email VARCHAR(320), login_method VARCHAR(64),
  role VARCHAR(64) NOT NULL DEFAULT 'user',
  status VARCHAR(16) NOT NULL DEFAULT 'active' CHECK (status IN ('active','disabled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_signed_in TIMESTAMPTZ NOT NULL DEFAULT now(), disabled_at TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS roles (id BIGSERIAL PRIMARY KEY, slug VARCHAR(64) NOT NULL UNIQUE, name VARCHAR(128) NOT NULL, description TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS permissions (id BIGSERIAL PRIMARY KEY, slug VARCHAR(128) NOT NULL UNIQUE, name VARCHAR(128) NOT NULL, description TEXT);
CREATE TABLE IF NOT EXISTS role_permissions (role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE, permission_id BIGINT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE, PRIMARY KEY (role_id, permission_id));
CREATE TABLE IF NOT EXISTS audit_logs (id BIGSERIAL PRIMARY KEY, actor_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL, action VARCHAR(128) NOT NULL, target_type VARCHAR(64), target_id VARCHAR(128), metadata JSONB, ip_address INET, user_agent TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
CREATE INDEX IF NOT EXISTS users_role_idx ON users(role);
CREATE INDEX IF NOT EXISTS users_status_idx ON users(status);
CREATE INDEX IF NOT EXISTS audit_logs_actor_idx ON audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS audit_logs_action_idx ON audit_logs(action);
