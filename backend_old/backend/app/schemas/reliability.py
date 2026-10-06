from datetime import date
from decimal import Decimal

from pydantic import BaseModel


class ReliabilityFactor(BaseModel):
    name: str
    score: Decimal | None
    description: str
    status: str


class ReliabilityTrend(BaseModel):
    evaluation_date: date
    performance_score: Decimal
    reliability_score: Decimal


class VendorReliabilitySummary(BaseModel):
    vendor_id: int
    vendor_name: str
    category: str
    vendor_status: str

    reliability_score: Decimal
    supplier_ranking: int
    procurement_risk_level: str

    factors: list[ReliabilityFactor]

    trend: list[ReliabilityTrend]

    recommendations: list[str]