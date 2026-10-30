from typing import List, Optional
from pydantic import BaseModel


class UserGroupResponse(BaseModel):
    id: str
    department_id: str
    name: str
    role_type: str
    description: str


class DepartmentTreeNode(BaseModel):
    id: str
    campus_id: str
    name: str
    code: str
    head_of_department: str
    user_groups: List[UserGroupResponse]
    device_count: int = 0


class CampusTreeNode(BaseModel):
    id: str
    institution_id: str
    name: str
    code: str
    location: str
    departments: List[DepartmentTreeNode]


class InstitutionTreeResponse(BaseModel):
    id: str
    name: str
    code: str
    domain: str
    campuses: List[CampusTreeNode]
    total_devices: int
    total_alerts_active: int

