"""Add delivery_type + delivery_url columns to generation_jobs.

Supports Block E (ZIP / Drive delivery). After this migration, jobs
can track where their exported deliverable lives:

- delivery_type: "zip" (local path) | "drive" (shareable URL) | NULL
- delivery_url: absolute path (for zip) or shareable URL (for drive)

Revision ID: 7a9f3d8b21c4
Revises: f3d8509b1541
Create Date: 2026-04-26 22:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "7a9f3d8b21c4"
down_revision: Union[str, None] = "f3d8509b1541"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "generation_jobs",
        sa.Column("delivery_type", sa.String(length=20), nullable=True),
    )
    op.add_column(
        "generation_jobs",
        sa.Column("delivery_url", sa.String(length=1000), nullable=True),
    )
    op.add_column(
        "generation_jobs",
        sa.Column("delivered_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("generation_jobs", "delivered_at")
    op.drop_column("generation_jobs", "delivery_url")
    op.drop_column("generation_jobs", "delivery_type")
