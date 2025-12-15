"""add_better_auth_tables

Revision ID: 53134e7b7865
Revises: 3230404ddfad
Create Date: 2025-12-13 23:56:15.533846

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = '53134e7b7865'
down_revision: Union[str, None] = '3230404ddfad'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create user table
    op.execute("""
    CREATE TABLE IF NOT EXISTS "user" (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      "emailVerified" BOOLEAN NOT NULL DEFAULT false,
      image TEXT,
      "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    # Create session table
    op.execute("""
    CREATE TABLE IF NOT EXISTS session (
      id TEXT PRIMARY KEY,
      "expiresAt" TIMESTAMP NOT NULL,
      token TEXT NOT NULL UNIQUE,
      "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "ipAddress" TEXT,
      "userAgent" TEXT,
      "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
    )
    """)
    
    op.execute("""
    CREATE INDEX IF NOT EXISTS "session_userId_idx" ON session("userId")
    """)
    
    # Create account table
    op.execute("""
    CREATE TABLE IF NOT EXISTS account (
      id TEXT PRIMARY KEY,
      "accountId" TEXT NOT NULL,
      "providerId" TEXT NOT NULL,
      "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      "accessToken" TEXT,
      "refreshToken" TEXT,
      "idToken" TEXT,
      "accessTokenExpiresAt" TIMESTAMP,
      "refreshTokenExpiresAt" TIMESTAMP,
      scope TEXT,
      password TEXT,
      "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    op.execute("""
    CREATE INDEX IF NOT EXISTS "account_userId_idx" ON account("userId")
    """)
    
    # Create verification table
    op.execute("""
    CREATE TABLE IF NOT EXISTS verification (
      id TEXT PRIMARY KEY,
      identifier TEXT NOT NULL,
      value TEXT NOT NULL,
      "expiresAt" TIMESTAMP NOT NULL,
      "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    op.execute("""
    CREATE INDEX IF NOT EXISTS "verification_identifier_idx" ON verification(identifier)
    """)


def downgrade() -> None:
    # Drop tables in reverse order (respecting foreign keys)
    op.execute('DROP TABLE IF EXISTS verification CASCADE')
    op.execute('DROP TABLE IF EXISTS account CASCADE')
    op.execute('DROP TABLE IF EXISTS session CASCADE')
    op.execute('DROP TABLE IF EXISTS "user" CASCADE')
