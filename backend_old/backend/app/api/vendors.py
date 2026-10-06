from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, require_roles
from app.models.user import User, UserRole
from app.models.vendor import Vendor
from app.schemas.vendor import (
    VendorCreate,
    VendorResponse,
    VendorUpdate,
)


router = APIRouter(
    prefix="/api/vendors",
    tags=["Vendors"],
)


VENDOR_CATEGORIES = [
    "Raw Material Suppliers",
    "Equipment Vendors",
    "IT Vendors",
    "Service Providers",
    "Logistics Partners",
    "Maintenance Vendors",
]


VENDOR_STATUSES = [
    "Pending",
    "Approved",
    "Rejected",
]


MANAGEMENT_ROLES = (
    UserRole.ADMINISTRATOR,
    UserRole.PROCUREMENT_MANAGER,
    UserRole.SUPPLY_CHAIN_MANAGER,
)


ADMIN_ROLE = (
    UserRole.ADMINISTRATOR,
)


def normalize_text(
    value: Optional[str],
) -> Optional[str]:

    if value is None:
        return None

    cleaned = value.strip()

    return cleaned if cleaned else None


def validate_category(
    category: str,
) -> str:

    cleaned = category.strip()

    if cleaned not in VENDOR_CATEGORIES:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Invalid vendor category. "
                "Allowed categories are: "
                + ", ".join(VENDOR_CATEGORIES)
            ),
        )

    return cleaned


def validate_status_value(
    value: str,
) -> str:

    cleaned = value.strip()

    if cleaned not in VENDOR_STATUSES:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Invalid vendor status. "
                "Allowed statuses are: "
                + ", ".join(VENDOR_STATUSES)
            ),
        )

    return cleaned


@router.get("/categories")
def get_vendor_categories(
    current_user: User = Depends(get_current_user),
):
    return {
        "categories": VENDOR_CATEGORIES
    }


@router.get("/statuses")
def get_vendor_statuses(
    current_user: User = Depends(get_current_user),
):
    return {
        "statuses": VENDOR_STATUSES
    }


@router.get(
    "",
    response_model=list[VendorResponse],
)
def get_vendors(
    category: Optional[str] = Query(
        default=None,
        description="Filter vendors by category",
    ),
    status: Optional[str] = Query(
        default=None,
        description="Filter vendors by status",
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    query = db.query(Vendor)

    category = normalize_text(category)
    status = normalize_text(status)

    if category:

        category = validate_category(category)

        query = query.filter(
            Vendor.category == category
        )

    if status:

        status = validate_status_value(status)

        query = query.filter(
            Vendor.status == status
        )

    return (
        query
        .order_by(Vendor.id.desc())
        .all()
    )


@router.get(
    "/{vendor_id}",
    response_model=VendorResponse,
)
def get_vendor(
    vendor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

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

    return vendor


@router.post(
    "",
    response_model=VendorResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_vendor(
    vendor: VendorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(*MANAGEMENT_ROLES)
    ),
):

    category = validate_category(
        vendor.category
    )

    new_vendor = Vendor(
        name=vendor.name.strip(),
        category=category,
        contact_person=vendor.contact_person.strip(),
        email=vendor.email.strip(),
        phone=vendor.phone.strip(),
        status="Pending",
        location=normalize_text(
            vendor.location
        ),
        contract_details=normalize_text(
            vendor.contract_details
        ),
        performance_score=None,
        reliability_score=None,
    )

    db.add(new_vendor)

    db.commit()

    db.refresh(new_vendor)

    return new_vendor


@router.put(
    "/{vendor_id}",
    response_model=VendorResponse,
)
def update_vendor(
    vendor_id: int,
    vendor: VendorUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(*MANAGEMENT_ROLES)
    ),
):

    existing_vendor = (
        db.query(Vendor)
        .filter(Vendor.id == vendor_id)
        .first()
    )

    if not existing_vendor:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vendor not found",
        )

    if vendor.name is not None:

        existing_vendor.name = (
            vendor.name.strip()
        )

    if vendor.category is not None:

        existing_vendor.category = (
            validate_category(
                vendor.category
            )
        )

    if vendor.contact_person is not None:

        existing_vendor.contact_person = (
            vendor.contact_person.strip()
        )

    if vendor.email is not None:

        existing_vendor.email = (
            vendor.email.strip()
        )

    if vendor.phone is not None:

        existing_vendor.phone = (
            vendor.phone.strip()
        )

    if vendor.location is not None:

        existing_vendor.location = (
            normalize_text(
                vendor.location
            )
        )

    if vendor.contract_details is not None:

        existing_vendor.contract_details = (
            normalize_text(
                vendor.contract_details
            )
        )

    db.commit()

    db.refresh(existing_vendor)

    return existing_vendor


@router.patch(
    "/{vendor_id}/status",
    response_model=VendorResponse,
)
def update_vendor_status(
    vendor_id: int,
    new_status: str = Query(
        ...,
        description="New vendor status",
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(*MANAGEMENT_ROLES)
    ),
):

    existing_vendor = (
        db.query(Vendor)
        .filter(Vendor.id == vendor_id)
        .first()
    )

    if not existing_vendor:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vendor not found",
        )

    existing_vendor.status = (
        validate_status_value(
            new_status
        )
    )

    db.commit()

    db.refresh(existing_vendor)

    return existing_vendor


@router.delete(
    "/{vendor_id}",
)
def delete_vendor(
    vendor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(*ADMIN_ROLE)
    ),
):

    existing_vendor = (
        db.query(Vendor)
        .filter(Vendor.id == vendor_id)
        .first()
    )

    if not existing_vendor:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vendor not found",
        )

    db.delete(existing_vendor)

    db.commit()

    return {
        "message": "Vendor deleted successfully"
    }