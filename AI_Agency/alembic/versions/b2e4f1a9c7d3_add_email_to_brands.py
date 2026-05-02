"""Add email column to brands.

Supports Block F intake wiring — captures the founder's email at
intake time so we can notify them when the job completes (and have
an outreach hook for YC follow-up / retention). Optional for now.

Revision ID: b2e4f1a9c7d3
Revises: 7a9f3d8b21c4
Create Date: 2026-05-02 02:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b2e4f1a9c7d3"
down_revision: Union[str, None] = "7a9f3d8b21c4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "brands",
        sa.Column("email", sa.String(length=320), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("brands", "email")
