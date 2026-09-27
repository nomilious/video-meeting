"""Use UTC timestamps and enforce meeting invariants for new writes."""

from alembic import op

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade():
    for table, columns in {
        "User": ["createdAt", "updatedAt"],
        "Meeting": ["date", "createdAt", "updatedAt"],
    }.items():
        for column in columns:
            op.execute(f'''ALTER TABLE "{table}" ALTER COLUMN "{column}"
                           TYPE TIMESTAMPTZ USING "{column}" AT TIME ZONE 'UTC' ''')
    # NOT VALID preserves legacy rows while enforcing constraints on all new writes.
    op.execute("""ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_participants_nonempty"
                  CHECK (cardinality(participants) > 0) NOT VALID""")
    op.execute("""ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_title_nonempty"
                  CHECK (length(trim(title)) > 0) NOT VALID""")


def downgrade():
    op.drop_constraint("Meeting_title_nonempty", "Meeting", type_="check")
    op.drop_constraint("Meeting_participants_nonempty", "Meeting", type_="check")
    for table, columns in {
        "User": ["createdAt", "updatedAt"],
        "Meeting": ["date", "createdAt", "updatedAt"],
    }.items():
        for column in columns:
            op.execute(f'''ALTER TABLE "{table}" ALTER COLUMN "{column}"
                           TYPE TIMESTAMP(3) USING "{column}" AT TIME ZONE 'UTC' ''')
