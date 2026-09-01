from typing import Optional, Literal
from pydantic import BaseModel, Field

class DemoLoginRequest(BaseModel):
    role: Literal["employee", "manager", "hse_officer"] = Field(default="employee", description="Demo role to activate")
    employee_id: Optional[str] = Field(default="EMP-1042", description="Employee ID for employee mode")

class StandardLoginRequest(BaseModel):
    username: str = Field(..., description="Username")
    password: str = Field(..., description="Password")

class SessionUserResponse(BaseModel):
    authenticated: bool = True
    role: str = "EMPLOYEE"
    user_id: str = "EMP-1042"
    employee_id: str = "EMP-1042"
    full_name: str = "Rajesh Kumar"
    plant_unit: str = "CDU-1"
    active_badge_id: str = "BAND-1042-01"
    is_demo: bool = True
