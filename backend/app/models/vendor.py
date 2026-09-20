from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Numeric
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Vendor(Base):
    __tablename__ = "vendors"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    category: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    contact_person: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    email: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    phone: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(50),
        default="Pending",
        nullable=False,
    )

    # ------------------------------------------------------------
    # MENTOR-REQUIRED VENDOR PROFILE FIELDS
    # ------------------------------------------------------------

    location: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    contract_details: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    performance_score: Mapped[float | None] = mapped_column(
        Numeric(5, 2),
        nullable=True,
    )

    reliability_score: Mapped[float | None] = mapped_column(
        Numeric(5, 2),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )