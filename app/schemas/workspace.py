from pydantic import BaseModel
from typing import Optional


class WorkspaceResponse(BaseModel):
    id: Optional[str] = None
