from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.vendor import Vendor


router = APIRouter(
    prefix="/api/profile",
    tags=["Profile"]
)


class VendorProfileResponse(BaseModel):

    id: int
    name: str
    category: str | None = None
    contact_person: str | None = None
    email: str
    phone: str | None = None
    location: str | None = None
    contract_details: str | None = None

    model_config = ConfigDict(
        from_attributes=True
    )


class VendorProfileUpdate(BaseModel):

    name: str | None = None
    category: str | None = None
    contact_person: str | None = None
    phone: str | None = None
    location: str | None = None


def get_vendor_for_current_user(
    current_user: User,
    db: Session
) -> Vendor | None:

    return (
        db.query(Vendor)
        .filter(
            Vendor.email == current_user.email
        )
        .first()
    )


@router.get(
    "/me",
    response_model=VendorProfileResponse
)
def get_my_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    if str(current_user.role).strip().upper() != "VENDOR":
        raise HTTPException(
            status_code=403,
            detail="Only Vendor users can access this profile."
        )

    vendor = get_vendor_for_current_user(
        current_user,
        db
    )

    if not vendor:
        raise HTTPException(
            status_code=404,
            detail="Vendor profile not found."
        )

    return vendor


@router.put(
    "/me",
    response_model=VendorProfileResponse
)
def update_my_profile(
    profile: VendorProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    if str(current_user.role).strip().upper() != "VENDOR":
        raise HTTPException(
            status_code=403,
            detail="Only Vendor users can update this profile."
        )

    vendor = get_vendor_for_current_user(
        current_user,
        db
    )

    if not vendor:
        raise HTTPException(
            status_code=404,
            detail="Vendor profile not found."
        )

    if profile.name is not None:
        vendor.name = profile.name.strip()

    if profile.category is not None:
        vendor.category = profile.category.strip()

    if profile.contact_person is not None:
        vendor.contact_person = (
            profile.contact_person.strip()
        )

    if profile.phone is not None:
        vendor.phone = profile.phone.strip()

    if profile.location is not None:
        vendor.location = profile.location.strip()

    db.commit()
    db.refresh(vendor)

    return vendor