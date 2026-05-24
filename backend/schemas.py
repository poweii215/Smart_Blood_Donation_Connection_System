from pydantic import BaseModel
from typing import Optional
from enum import Enum

class UserRole(str, Enum):
    DONOR = "DONOR"
    HOSPITAL_ADMIN = "HOSPITAL_ADMIN"

class AppointmentStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    CHECKED_IN = "CHECKED_IN"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class UserBase(BaseModel):
    phone: str
    full_name: str = "New Donor"
    role: UserRole = UserRole.DONOR
    blood_type: Optional[str] = "UNKNOWN"

class UserCreate(UserBase):
    password: Optional[str] = None
    email: Optional[str] = None
    # Donor registration profile fields
    birth_date: Optional[str] = None
    gender: Optional[str] = None
    citizen_id: Optional[str] = None
    weight: Optional[float] = None
    height: Optional[float] = None
    address: Optional[str] = None
    occupation: Optional[str] = None
    # Hospital registration fields
    hospital_name: Optional[str] = None
    hospital_code: Optional[str] = None
    city: Optional[str] = None
    district: Optional[str] = None
    contact_name: Optional[str] = None
    contact_title: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None

class UserLogin(BaseModel):
    phone: Optional[str] = None
    identifier: Optional[str] = None
    password: Optional[str] = None
    login_type: Optional[str] = "DONOR"

class Token(BaseModel):
    token: str
    user: dict

class BloodInventoryBase(BaseModel):
    blood_type: str
    quantity: float
    safety_threshold: float

class AppointmentBase(BaseModel):
    appointment_date: str
    notes: Optional[str] = None
    pre_screening_result: Optional[str] = None

class AppointmentCreate(AppointmentBase):
    pass

class InventoryTransactionCreate(BaseModel):
    blood_type: str
    quantity: float
    transaction_type: str
    note: Optional[str] = None

class AppointmentUpdateStatus(BaseModel):
    status: AppointmentStatus

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    blood_type: Optional[str] = None
    birth_date: Optional[str] = None
    gender: Optional[str] = None
    citizen_id: Optional[str] = None
    weight: Optional[float] = None
    height: Optional[float] = None
    address: Optional[str] = None
    occupation: Optional[str] = None
    hospital_name: Optional[str] = None
    hospital_code: Optional[str] = None
    city: Optional[str] = None
    district: Optional[str] = None
    contact_name: Optional[str] = None
    contact_title: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None

class RecommendationRequest(BaseModel):
    blood_type: str
    top_n: int = 10
    w_blood: float = 0.45
    w_eligibility: float = 0.25
    w_reliability: float = 0.2
    w_humanitarian: float = 0.1


class RecommendationWeights(BaseModel):
    w_blood: float = 0.45
    w_eligibility: float = 0.30
    w_reliability: float = 0.15
    w_humanitarian: float = 0.10

class RecommendationSettings(RecommendationWeights):
    emergency_w_blood: float = 0.60
    emergency_w_eligibility: float = 0.25
    emergency_w_reliability: float = 0.10
    emergency_w_humanitarian: float = 0.05
    emergency_auto_adjust: bool = True

class RecommendationEmailRequest(BaseModel):
    recommendation_result_ids: list[int]
    subject: Optional[str] = None
    message: Optional[str] = None
