from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_session
from app.models.user import User
from app.models.workspace import Workspace
from app.schemas.workspace import WorkspaceResponse
from app.core.auth import get_current_user
from typing import Optional

router = APIRouter(prefix="/workspaces", tags=["workspaces"])


@router.get("/current", response_model=WorkspaceResponse)
async def get_current_workspace(
        session: AsyncSession = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    """
    Get the current user's workspace

    Returns the workspace associated with the authenticated user. The workspace
    is determined by checking:
    1. If the user is the owner of a workspace (first created workspace is returned)
    2. If the user is a member of a workspace (first joined workspace is returned)

    Returns:
        Workspace details including id, name, description, owner_id, and timestamps

    Raises:
        404: If the user has no associated workspace
    """
    # First search as owner
    q_owner = select(Workspace).where(Workspace.owner_id == current_user.id).order_by(Workspace.created_at.asc())
    res = await session.execute(q_owner)
    ws: Optional[Workspace] = res.scalars().first()

    # If not found - search as member
    if not ws:
        from app.models.workspace import workspace_members

        # Make sure we use correct types for comparison
        user_id = current_user.id

        q_member = (
            select(Workspace)
            .join(workspace_members, Workspace.id == workspace_members.c.workspace_id)
            .where(workspace_members.c.user_id == user_id)
            .order_by(Workspace.created_at.asc())
        )
        res = await session.execute(q_member)
        ws = res.scalars().first()

    if not ws:
        raise HTTPException(status_code=404, detail="No workspace found for this user")

    return WorkspaceResponse(**ws.to_dict())
