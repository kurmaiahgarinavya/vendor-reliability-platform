from decimal import Decimal, ROUND_HALF_UP

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.vendor import Vendor
from app.models.purchase_order import PurchaseOrder
from app.models.vendor_performance import VendorPerformance
from app.schemas.vendor_performance import (
    VendorPerformanceCreate,
    VendorPerformanceHistory,
    VendorPerformanceResponse,
    VendorPerformanceSummary,
)


router = APIRouter(
    prefix="/api/vendor-performance",
    tags=["Vendor Performance"],
)


MANAGEMENT_ROLES = {
    "ADMINISTRATOR",
    "PROCUREMENT MANAGER",
    "SUPPLY CHAIN MANAGER",
}


def normalize_role(role: str | None) -> str:
    return (role or "").strip().upper().replace("_", " ")


def decimal_value(value):
    if value is None:
        return None

    return Decimal(str(value))


def rounded(value, places=2):
    if value is None:
        return None

    quantizer = Decimal("1." + ("0" * places))

    return Decimal(str(value)).quantize(
        quantizer,
        rounding=ROUND_HALF_UP,
    )


def calculate_performance_score(
    on_time_rate: Decimal,
    completion_rate: Decimal,
    quality_rating: Decimal | None,
    service_rating: Decimal | None,
    response_time_hours: Decimal | None,
    issue_resolution_time_hours: Decimal | None,
) -> Decimal:

    score = Decimal("0")

    # Delivery performance - 30%
    score += on_time_rate * Decimal("0.30")

    # Order completion - 20%
    score += completion_rate * Decimal("0.20")

    # Quality - 20%
    if quality_rating is not None:
        score += (quality_rating / Decimal("5")) * Decimal("100") * Decimal("0.20")

    # Service - 15%
    if service_rating is not None:
        score += (service_rating / Decimal("5")) * Decimal("100") * Decimal("0.15")

    # Response time - 7.5%
    if response_time_hours is not None:
        response_component = max(
            Decimal("0"),
            Decimal("100") - (response_time_hours * Decimal("5")),
        )
        score += response_component * Decimal("0.075")

    # Issue resolution - 7.5%
    if issue_resolution_time_hours is not None:
        resolution_component = max(
            Decimal("0"),
            Decimal("100") - (issue_resolution_time_hours * Decimal("2")),
        )
        score += resolution_component * Decimal("0.075")

    return rounded(min(score, Decimal("100")))


def build_summary(
    vendor: Vendor,
    db: Session,
) -> VendorPerformanceSummary:

    orders = (
        db.query(PurchaseOrder)
        .filter(PurchaseOrder.vendor_id == vendor.id)
        .all()
    )

    evaluations = (
        db.query(VendorPerformance)
        .filter(VendorPerformance.vendor_id == vendor.id)
        .all()
    )

    total_orders = len(orders)

    on_time_deliveries = 0
    delayed_deliveries = 0

    for evaluation in evaluations:

        if (
            evaluation.purchase_order_id is None
            or evaluation.actual_delivery_date is None
        ):
            continue

        purchase_order = next(
            (
                order
                for order in orders
                if order.id == evaluation.purchase_order_id
            ),
            None,
        )

        if purchase_order is None:
            continue

        if (
            evaluation.actual_delivery_date
            <= purchase_order.expected_delivery_date
        ):
            on_time_deliveries += 1
        else:
            delayed_deliveries += 1

    completed_statuses = {
        "DELIVERED",
        "COMPLETED",
    }

    completed_orders = sum(
        1
        for order in orders
        if (order.status or "").strip().upper() in completed_statuses
    )

    if total_orders:
        completion_rate = (
            Decimal(completed_orders)
            / Decimal(total_orders)
            * Decimal("100")
        )
    else:
        completion_rate = Decimal("0")

    delivery_evaluated = (
        on_time_deliveries + delayed_deliveries
    )

    if delivery_evaluated:
        on_time_rate = (
            Decimal(on_time_deliveries)
            / Decimal(delivery_evaluated)
            * Decimal("100")
        )
    else:
        on_time_rate = Decimal("0")

    quality_values = [
        decimal_value(e.quality_rating)
        for e in evaluations
        if e.quality_rating is not None
    ]

    service_values = [
        decimal_value(e.service_rating)
        for e in evaluations
        if e.service_rating is not None
    ]

    response_values = [
        decimal_value(e.response_time_hours)
        for e in evaluations
        if e.response_time_hours is not None
    ]

    resolution_values = [
        decimal_value(e.issue_resolution_time_hours)
        for e in evaluations
        if e.issue_resolution_time_hours is not None
    ]

    quality_rating = (
        sum(quality_values) / Decimal(len(quality_values))
        if quality_values
        else None
    )

    service_rating = (
        sum(service_values) / Decimal(len(service_values))
        if service_values
        else None
    )

    response_time_hours = (
        sum(response_values) / Decimal(len(response_values))
        if response_values
        else None
    )

    issue_resolution_time_hours = (
        sum(resolution_values) / Decimal(len(resolution_values))
        if resolution_values
        else None
    )

    performance_score = calculate_performance_score(
        on_time_rate=on_time_rate,
        completion_rate=completion_rate,
        quality_rating=quality_rating,
        service_rating=service_rating,
        response_time_hours=response_time_hours,
        issue_resolution_time_hours=issue_resolution_time_hours,
    )

    if performance_score >= 80:
        performance_status = "Excellent"
    elif performance_score >= 65:
        performance_status = "Good"
    elif performance_score >= 50:
        performance_status = "Needs Attention"
    else:
        performance_status = "Poor"

    return VendorPerformanceSummary(
        vendor_id=vendor.id,
        vendor_name=vendor.name,
        category=vendor.category,
        vendor_status=vendor.status,

        total_orders=total_orders,
        on_time_deliveries=on_time_deliveries,
        delayed_deliveries=delayed_deliveries,

        quality_rating=rounded(quality_rating),
        service_rating=rounded(service_rating),

        response_time_hours=rounded(response_time_hours),
        issue_resolution_time_hours=rounded(issue_resolution_time_hours),

        order_completion_rate=rounded(completion_rate),

        performance_score=performance_score,
        ranking=0,

        performance_status=performance_status,
    )


@router.get(
    "",
    response_model=list[VendorPerformanceSummary],
)
def get_vendor_performance(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    vendors = (
        db.query(Vendor)
        .order_by(Vendor.name.asc())
        .all()
    )

    summaries = [
        build_summary(vendor, db)
        for vendor in vendors
    ]

    summaries.sort(
        key=lambda item: item.performance_score,
        reverse=True,
    )

    for index, summary in enumerate(summaries, start=1):
        summary.ranking = index

    return summaries


@router.get(
    "/{vendor_id}/history",
    response_model=list[VendorPerformanceHistory],
)
def get_vendor_performance_history(
    vendor_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    vendor = (
        db.query(Vendor)
        .filter(Vendor.id == vendor_id)
        .first()
    )

    if not vendor:
        raise HTTPException(
            status_code=404,
            detail="Vendor not found",
        )

    evaluations = (
        db.query(VendorPerformance)
        .filter(VendorPerformance.vendor_id == vendor_id)
        .order_by(
            VendorPerformance.evaluation_date.desc(),
            VendorPerformance.created_at.desc(),
        )
        .all()
    )

    result = []

    for evaluation in evaluations:

        purchase_order = None

        if evaluation.purchase_order_id:
            purchase_order = (
                db.query(PurchaseOrder)
                .filter(
                    PurchaseOrder.id
                    == evaluation.purchase_order_id
                )
                .first()
            )

        delivery_status = "Not Evaluated"

        expected_date = None

        if purchase_order:
            expected_date = purchase_order.expected_delivery_date

            if evaluation.actual_delivery_date:
                if (
                    evaluation.actual_delivery_date
                    <= purchase_order.expected_delivery_date
                ):
                    delivery_status = "On Time"
                else:
                    delivery_status = "Delayed"

        result.append(
            VendorPerformanceHistory(
                id=evaluation.id,
                vendor_id=vendor.id,
                vendor_name=vendor.name,

                purchase_order_id=evaluation.purchase_order_id,

                purchase_order_number=(
                    purchase_order.po_number
                    if purchase_order
                    else None
                ),

                expected_delivery_date=expected_date,
                actual_delivery_date=evaluation.actual_delivery_date,

                delivery_status=delivery_status,

                quality_rating=evaluation.quality_rating,
                service_rating=evaluation.service_rating,

                response_time_hours=evaluation.response_time_hours,
                issue_resolution_time_hours=(
                    evaluation.issue_resolution_time_hours
                ),

                issue_count=evaluation.issue_count,
                notes=evaluation.notes,

                evaluation_date=evaluation.evaluation_date,
            )
        )

    return result


@router.post(
    "",
    response_model=VendorPerformanceResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_vendor_performance(
    performance: VendorPerformanceCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    role = normalize_role(getattr(current_user, "role", None))

    if role not in MANAGEMENT_ROLES:
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to create vendor performance evaluations",
        )

    vendor = (
        db.query(Vendor)
        .filter(Vendor.id == performance.vendor_id)
        .first()
    )

    if not vendor:
        raise HTTPException(
            status_code=404,
            detail="Vendor not found",
        )

    if performance.purchase_order_id:

        purchase_order = (
            db.query(PurchaseOrder)
            .filter(
                PurchaseOrder.id
                == performance.purchase_order_id
            )
            .first()
        )

        if not purchase_order:
            raise HTTPException(
                status_code=404,
                detail="Purchase order not found",
            )

        if purchase_order.vendor_id != performance.vendor_id:
            raise HTTPException(
                status_code=400,
                detail="Purchase order does not belong to this vendor",
            )

    new_performance = VendorPerformance(
        vendor_id=performance.vendor_id,
        purchase_order_id=performance.purchase_order_id,
        actual_delivery_date=performance.actual_delivery_date,
        quality_rating=performance.quality_rating,
        service_rating=performance.service_rating,
        response_time_hours=performance.response_time_hours,
        issue_resolution_time_hours=(
            performance.issue_resolution_time_hours
        ),
        issue_count=performance.issue_count,
        notes=performance.notes,
        evaluation_date=performance.evaluation_date,
        created_by=current_user.id,
    )

    db.add(new_performance)
    db.commit()
    db.refresh(new_performance)

    return new_performance


@router.delete(
    "/evaluations/{evaluation_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_vendor_performance(
    evaluation_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    role = normalize_role(getattr(current_user, "role", None))

    if role not in MANAGEMENT_ROLES:
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to delete evaluations",
        )

    evaluation = (
        db.query(VendorPerformance)
        .filter(VendorPerformance.id == evaluation_id)
        .first()
    )

    if not evaluation:
        raise HTTPException(
            status_code=404,
            detail="Performance evaluation not found",
        )

    db.delete(evaluation)
    db.commit()

    return None