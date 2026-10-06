from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_roles
from app.models.procurement import ProcurementRequest
from app.models.user import UserRole
from app.models.vendor import Vendor
from app.schemas.procurement import (
    PROCUREMENT_PRIORITIES,
    PROCUREMENT_STATUSES,
    ProcurementCreate,
    ProcurementResponse,
    ProcurementStatusUpdate,
    ProcurementUpdate,
)


router = APIRouter(
    prefix="/api/procurement",
    tags=["Procurement Management"],
)


# =========================================================
# PROCUREMENT MANAGEMENT ROLES
# =========================================================

MANAGEMENT_ROLES = (
    UserRole.ADMINISTRATOR,
    UserRole.PROCUREMENT_MANAGER,
    UserRole.SUPPLY_CHAIN_MANAGER,
)


# =========================================================
# PRIORITIES
# =========================================================

@router.get(
    "/priorities",
    response_model=list[str],
)
def get_priorities(
    current_user=Depends(
        require_roles(*MANAGEMENT_ROLES)
    ),
):
    return PROCUREMENT_PRIORITIES


# =========================================================
# STATUSES
# =========================================================

@router.get(
    "/statuses",
    response_model=list[str],
)
def get_statuses(
    current_user=Depends(
        require_roles(*MANAGEMENT_ROLES)
    ),
):
    return PROCUREMENT_STATUSES


# =========================================================
# CREATE PROCUREMENT REQUEST
# =========================================================

@router.post(
    "",
    response_model=ProcurementResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_procurement_request(
    request: ProcurementCreate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(*MANAGEMENT_ROLES)
    ),
):
    if request.priority not in PROCUREMENT_PRIORITIES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid procurement priority",
        )

    if request.vendor_id is not None:

        vendor = (
            db.query(Vendor)
            .filter(Vendor.id == request.vendor_id)
            .first()
        )

        if not vendor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Vendor not found",
            )

    new_request = ProcurementRequest(
        title=request.title,
        vendor_id=request.vendor_id,
        category=request.category,
        quantity=request.quantity,
        estimated_cost=request.estimated_cost,
        priority=request.priority,
        status="Pending",
        created_by=current_user.id,
    )

    db.add(new_request)
    db.commit()
    db.refresh(new_request)

    return new_request


# =========================================================
# GET PROCUREMENT REQUESTS
# =========================================================

@router.get(
    "",
    response_model=list[ProcurementResponse],
)
def get_procurement_requests(
    request_status: str | None = None,
    current_user=Depends(
        require_roles(*MANAGEMENT_ROLES)
    ),
    db: Session = Depends(get_db),
):
    query = db.query(ProcurementRequest)

    if request_status:

        if request_status not in PROCUREMENT_STATUSES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid procurement status",
            )

        query = query.filter(
            ProcurementRequest.status == request_status
        )

    return (
        query
        .order_by(ProcurementRequest.id.desc())
        .all()
    )


# =========================================================
# GET SINGLE PROCUREMENT REQUEST
# =========================================================

@router.get(
    "/{request_id}",
    response_model=ProcurementResponse,
)
def get_procurement_request(
    request_id: int,
    current_user=Depends(
        require_roles(*MANAGEMENT_ROLES)
    ),
    db: Session = Depends(get_db),
):
    request = (
        db.query(ProcurementRequest)
        .filter(
            ProcurementRequest.id == request_id
        )
        .first()
    )

    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Procurement request not found",
        )

    return request


# =========================================================
# UPDATE PROCUREMENT REQUEST
# =========================================================

@router.put(
    "/{request_id}",
    response_model=ProcurementResponse,
)
def update_procurement_request(
    request_id: int,
    request_data: ProcurementUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(*MANAGEMENT_ROLES)
    ),
):
    request = (
        db.query(ProcurementRequest)
        .filter(
            ProcurementRequest.id == request_id
        )
        .first()
    )

    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Procurement request not found",
        )

    updates = request_data.model_dump(
        exclude_unset=True
    )

    if "priority" in updates:

        if updates["priority"] not in PROCUREMENT_PRIORITIES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid procurement priority",
            )

    if "vendor_id" in updates:

        vendor_id = updates["vendor_id"]

        if vendor_id is not None:

            vendor = (
                db.query(Vendor)
                .filter(Vendor.id == vendor_id)
                .first()
            )

            if not vendor:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Vendor not found",
                )

    for field, value in updates.items():
        setattr(request, field, value)

    db.commit()
    db.refresh(request)

    return request


# =========================================================
# UPDATE PROCUREMENT STATUS
# =========================================================

@router.patch(
    "/{request_id}/status",
    response_model=ProcurementResponse,
)
def update_procurement_status(
    request_id: int,
    status_data: ProcurementStatusUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(*MANAGEMENT_ROLES)
    ),
):
    if status_data.status not in PROCUREMENT_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid procurement status",
        )

    request = (
        db.query(ProcurementRequest)
        .filter(
            ProcurementRequest.id == request_id
        )
        .first()
    )

    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Procurement request not found",
        )

    request.status = status_data.status

    db.commit()
    db.refresh(request)

    return request


# =========================================================
# DELETE PROCUREMENT REQUEST
# =========================================================

@router.delete(
    "/{request_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_procurement_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(UserRole.ADMINISTRATOR)
    ),
):
    request = (
        db.query(ProcurementRequest)
        .filter(
            ProcurementRequest.id == request_id
        )
        .first()
    )

    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Procurement request not found",
        )

    db.delete(request)
    db.commit()

    return None