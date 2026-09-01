from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class Vendor(BaseModel):
    name: str
    reliability_score: int


# Temporary vendor list
vendors = [
    {
        "id": 1,
        "name": "ABC Suppliers",
        "reliability_score": 92
    },
    {
        "id": 2,
        "name": "XYZ Technologies",
        "reliability_score": 85
    },
    {
        "id": 3,
        "name": "Reliable Parts",
        "reliability_score": 65
    },
    {
        "id": 4,
        "name": "Low Quality Supplies",
        "reliability_score": 40
    }
]


# Calculate reliability status
def calculate_status(score):

    if score >= 90:
        return "Excellent"
    elif score >= 70:
        return "Good"
    elif score >= 50:
        return "Average"
    else:
        return "Poor"


# Calculate risk level
def calculate_risk(score):

    if score >= 90:
        return "Low Risk"
    elif score >= 70:
        return "Medium Risk"
    elif score >= 50:
        return "High Risk"
    else:
        return "Critical Risk"


# Get all vendors
@router.get("/vendors")
def get_vendors():
    return {
        "vendors": vendors
    }


# Get one vendor by ID
@router.get("/vendors/{vendor_id}")
def get_vendor(vendor_id: int):

    for vendor in vendors:
        if vendor["id"] == vendor_id:
            return vendor

    return {
        "message": "Vendor not found"
    }


# Add a new vendor
@router.post("/vendors")
def add_vendor(vendor: Vendor):

    new_vendor = {
        "id": len(vendors) + 1,
        "name": vendor.name,
        "reliability_score": vendor.reliability_score
    }

    vendors.append(new_vendor)

    return {
        "message": "Vendor added successfully",
        "vendor": new_vendor
    }


# Update a vendor
@router.put("/vendors/{vendor_id}")
def update_vendor(vendor_id: int, updated_vendor: Vendor):

    for vendor in vendors:
        if vendor["id"] == vendor_id:

            vendor["name"] = updated_vendor.name
            vendor["reliability_score"] = updated_vendor.reliability_score

            return {
                "message": "Vendor updated successfully",
                "vendor": vendor
            }

    return {
        "message": "Vendor not found"
    }


# Delete a vendor
@router.delete("/vendors/{vendor_id}")
def delete_vendor(vendor_id: int):

    for vendor in vendors:
        if vendor["id"] == vendor_id:

            vendors.remove(vendor)

            return {
                "message": "Vendor deleted successfully"
            }

    return {
        "message": "Vendor not found"
    }


# Get vendor reliability status
@router.get("/vendors/{vendor_id}/status")
def get_vendor_status(vendor_id: int):

    for vendor in vendors:
        if vendor["id"] == vendor_id:

            score = vendor["reliability_score"]

            return {
                "vendor_id": vendor_id,
                "name": vendor["name"],
                "reliability_score": score,
                "status": calculate_status(score)
            }

    return {
        "message": "Vendor not found"
    }


# Get vendor risk level
@router.get("/vendors/{vendor_id}/risk")
def get_vendor_risk(vendor_id: int):

    for vendor in vendors:
        if vendor["id"] == vendor_id:

            score = vendor["reliability_score"]

            return {
                "vendor_id": vendor_id,
                "name": vendor["name"],
                "reliability_score": score,
                "risk_level": calculate_risk(score)
            }

    return {
        "message": "Vendor not found"
    }


# Dashboard summary
@router.get("/dashboard")
def get_dashboard():

    excellent = 0
    good = 0
    average = 0
    poor = 0

    for vendor in vendors:

        status = calculate_status(vendor["reliability_score"])

        if status == "Excellent":
            excellent += 1
        elif status == "Good":
            good += 1
        elif status == "Average":
            average += 1
        else:
            poor += 1

    return {
        "total_vendors": len(vendors),
        "excellent": excellent,
        "good": good,
        "average": average,
        "poor": poor
    }