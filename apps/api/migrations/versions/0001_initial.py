"""Create the schema or adopt existing Prisma tables without deleting data."""

from alembic import op

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.execute("""
        CREATE TABLE IF NOT EXISTS "User" (
            id TEXT PRIMARY KEY,
            email TEXT NOT NULL,
            "passwordHash" TEXT NOT NULL,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL
        )
    """)
    op.execute('CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User" (email)')
    op.execute("""
        CREATE TABLE IF NOT EXISTS "Meeting" (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            date TIMESTAMP(3) NOT NULL,
            participants TEXT[] NOT NULL,
            "ownerId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE ON UPDATE CASCADE,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL
        )
    """)
    op.execute('ALTER TABLE "Meeting" ALTER COLUMN participants SET NOT NULL')
    op.execute('CREATE INDEX IF NOT EXISTS "Meeting_ownerId_idx" ON "Meeting" ("ownerId")')


def downgrade():
    # A baseline may have adopted user data; never drop it on downgrade.
    pass
