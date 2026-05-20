from fastapi import APIRouter

router = APIRouter()

@router.get("")
async def get_hospitals():
    # Kept only for backward compatibility with old frontend code.
    # The system now manages one fixed hospital only.
    return [{
        "id": 1,
        "name": "Central Blood Donation Hospital",
        "address": "Main Blood Donation Center",
        "status": "ACTIVE",
        "contact_phone": "1900-0000",
    }]
