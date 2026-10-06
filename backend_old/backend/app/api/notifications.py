from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.notification import Notification
from app.models.user import User
from app.models.vendor import Vendor
from app.models.purchase_order import PurchaseOrder
from app.models.contract import Contract
from app.schemas.notification import (
    NotificationCreate,
    NotificationResponse,
    NotificationSummary,
)


router = APIRouter(
    prefix="/api/notifications",
    tags=["Notifications"],
)


def normalize_role(role) -> str:
    if hasattr(role, "value"):
        role = role.value

    return str(role or "").strip().upper().replace(" ", "_")


def create_if_missing(
    db: Session,
    *,
    user_id: int,
    notification_type: str,
    title: str,
    message: str,
    channel: str = "IN_APP",
    vendor_id: int | None = None,
    source_type: str | None = None,
    source_id: int | None = None,
):
    existing = None

    if source_type and source_id:
        existing = (
            db.query(Notification)
            .filter(
                Notification.user_id == user_id,
                Notification.notification_type == notification_type,
                Notification.source_type == source_type,
                Notification.source_id == source_id,
            )
            .first()
        )

    if existing:
        return existing

    notification = Notification(
        user_id=user_id,
        vendor_id=vendor_id,
        notification_type=notification_type,
        title=title,
        message=message,
        channel=channel,
        delivery_status="SENT" if channel == "IN_APP" else "PENDING",
        source_type=source_type,
        source_id=source_id,
    )

    db.add(notification)
    return notification


@router.get(
    "",
    response_model=list[NotificationResponse],
)
def get_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .all()
    )


@router.get(
    "/summary",
    response_model=NotificationSummary,
)
def get_notification_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    base = Notification.user_id == current_user.id

    total = (
        db.query(func.count(Notification.id))
        .filter(base)
        .scalar()
        or 0
    )

    unread = (
        db.query(func.count(Notification.id))
        .filter(
            base,
            Notification.is_read.is_(False),
        )
        .scalar()
        or 0
    )

    def count_type(notification_type: str) -> int:
        return (
            db.query(func.count(Notification.id))
            .filter(
                base,
                Notification.notification_type == notification_type,
            )
            .scalar()
            or 0
        )

    return NotificationSummary(
        total=total,
        unread=unread,
        procurement_alerts=count_type("PROCUREMENT_ALERT"),
        delivery_delays=count_type("DELIVERY_DELAY"),
        vendor_approvals=count_type("VENDOR_APPROVAL"),
        contract_expiry_alerts=count_type("CONTRACT_EXPIRY"),
        compliance_alerts=count_type("COMPLIANCE"),
    )


@router.post(
    "",
    response_model=NotificationResponse,
)
def create_notification(
    data: NotificationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notification = Notification(
        user_id=data.user_id,
        vendor_id=data.vendor_id,
        notification_type=data.notification_type,
        title=data.title,
        message=data.message,
        channel=data.channel,
        delivery_status="SENT" if data.channel == "IN_APP" else "PENDING",
        source_type=data.source_type,
        source_id=data.source_id,
    )

    db.add(notification)
    db.commit()
    db.refresh(notification)

    return notification


@router.patch(
    "/{notification_id}/read",
    response_model=NotificationResponse,
)
def mark_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notification = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id,
            Notification.user_id == current_user.id,
        )
        .first()
    )

    if not notification:
        raise HTTPException(
            status_code=404,
            detail="Notification not found",
        )

    notification.is_read = True
    notification.read_at = datetime.utcnow()

    db.commit()
    db.refresh(notification)

    return notification


@router.patch(
    "/read-all",
)
def mark_all_as_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notifications = (
        db.query(Notification)
        .filter(
            Notification.user_id == current_user.id,
            Notification.is_read.is_(False),
        )
        .all()
    )

    now = datetime.utcnow()

    for notification in notifications:
        notification.is_read = True
        notification.read_at = now

    db.commit()

    return {
        "message": "All notifications marked as read",
        "updated": len(notifications),
    }


@router.delete(
    "/{notification_id}",
)
def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notification = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id,
            Notification.user_id == current_user.id,
        )
        .first()
    )

    if not notification:
        raise HTTPException(
            status_code=404,
            detail="Notification not found",
        )

    db.delete(notification)
    db.commit()

    return {
        "message": "Notification deleted",
    }


@router.post(
    "/sync",
)
def sync_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generate database-backed notifications from the current
    procurement/vendor/contract data.

    Duplicate notifications are prevented using source_type/source_id.
    """

    role = normalize_role(current_user.role)
    created = 0

    # ---------------------------------------------------------
    # 1. Vendor approval notifications
    # ---------------------------------------------------------

    pending_vendors = (
        db.query(Vendor)
        .filter(Vendor.status.ilike("Pending"))
        .all()
    )

    if role in {
        "ADMINISTRATOR",
        "PROCUREMENT_MANAGER",
        "SUPPLY_CHAIN_MANAGER",
    }:
        for vendor in pending_vendors:
            notification = create_if_missing(
                db,
                user_id=current_user.id,
                vendor_id=vendor.id,
                notification_type="VENDOR_APPROVAL",
                title="Vendor Approval Required",
                message=(
                    f"Vendor '{vendor.name}' is waiting for approval."
                ),
                source_type="VENDOR",
                source_id=vendor.id,
            )

            if notification.id is None:
                created += 1

    # ---------------------------------------------------------
    # 2. Purchase order / procurement alerts
    # ---------------------------------------------------------

    pending_orders = (
        db.query(PurchaseOrder)
        .filter(
            PurchaseOrder.status.in_(
                ["Pending", "Approved"]
            )
        )
        .all()
    )

    if role in {
        "ADMINISTRATOR",
        "PROCUREMENT_MANAGER",
        "SUPPLY_CHAIN_MANAGER",
    }:
        for order in pending_orders:
            notification = create_if_missing(
                db,
                user_id=current_user.id,
                notification_type="PROCUREMENT_ALERT",
                title="Procurement Alert",
                message=(
                    f"Purchase Order {order.po_number} "
                    f"currently has status '{order.status}'."
                ),
                vendor_id=order.vendor_id,
                source_type="PURCHASE_ORDER",
                source_id=order.id,
            )

            if notification.id is None:
                created += 1

    # ---------------------------------------------------------
    # 3. Delivery delay notifications
    # ---------------------------------------------------------

    today = datetime.utcnow().date()

    delayed_orders = (
        db.query(PurchaseOrder)
        .filter(
            PurchaseOrder.expected_delivery_date < today,
            PurchaseOrder.status.notin_(
                ["Delivered", "Completed", "Cancelled"]
            ),
        )
        .all()
    )

    for order in delayed_orders:
        notification = create_if_missing(
            db,
            user_id=current_user.id,
            notification_type="DELIVERY_DELAY",
            title="Delivery Delay Alert",
            message=(
                f"Purchase Order {order.po_number} "
                f"has passed its expected delivery date."
            ),
            vendor_id=order.vendor_id,
            source_type="DELIVERY",
            source_id=order.id,
        )

        if notification.id is None:
            created += 1

    # ---------------------------------------------------------
    # 4. Contract expiry notifications
    # ---------------------------------------------------------

    expiry_limit = today + timedelta(days=30)

    contracts = (
        db.query(Contract)
        .filter(
            Contract.end_date <= expiry_limit,
            Contract.end_date >= today,
        )
        .all()
    )

    for contract in contracts:
        notification = create_if_missing(
            db,
            user_id=current_user.id,
            notification_type="CONTRACT_EXPIRY",
            title="Contract Expiry Alert",
            message=(
                f"Contract {contract.contract_number} "
                f"will expire on {contract.end_date}."
            ),
            vendor_id=contract.vendor_id,
            source_type="CONTRACT",
            source_id=contract.id,
        )

        if notification.id is None:
            created += 1

    # ---------------------------------------------------------
    # 5. Compliance notifications
    # ---------------------------------------------------------

    non_compliant_contracts = (
        db.query(Contract)
        .filter(
            Contract.compliance_status.ilike("Non-Compliant")
        )
        .all()
    )

    for contract in non_compliant_contracts:
        notification = create_if_missing(
            db,
            user_id=current_user.id,
            notification_type="COMPLIANCE",
            title="Compliance Alert",
            message=(
                f"Contract {contract.contract_number} "
                f"requires compliance attention."
            ),
            vendor_id=contract.vendor_id,
            source_type="COMPLIANCE",
            source_id=contract.id,
        )

        if notification.id is None:
            created += 1

    db.commit()

    return {
        "message": "Notification synchronization completed",
        "created": created,
    }