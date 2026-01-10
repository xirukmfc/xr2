#!/usr/bin/env python3
"""
Script to create A/B test and generate events for user 'eee' on production
"""
import asyncio
import sys
import os
from datetime import datetime, timezone, timedelta
from uuid import uuid4

# Add app to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select

from app.models.user import User
from app.models.prompt import Prompt, PromptVersion
from app.models.analytics import ABTest, PromptEvent, CustomFunnelConfiguration
from app.core.database import get_session
from app.core.security import create_access_token

async def main():
    # Database URL from environment or default
    database_url = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/xr2")
    
    engine = create_async_engine(database_url, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as db:
        # Find user 'eee'
        user_result = await db.execute(select(User).where(User.username == 'eee'))
        user = user_result.scalar_one_or_none()
        
        if not user:
            print("ERROR: User 'eee' not found")
            return
        
        print(f"Found user: {user.username} (ID: {user.id})")
        
        # Get user's workspace
        from app.models.workspace import Workspace
        workspace_result = await db.execute(
            select(Workspace).where(Workspace.owner_id == user.id).order_by(Workspace.created_at.asc())
        )
        workspace = workspace_result.scalar_one_or_none()
        
        if not workspace:
            print("ERROR: User has no workspace")
            return
        
        print(f"Found workspace: {workspace.id}")
        
        # Find a prompt with at least 2 versions
        prompt_result = await db.execute(
            select(Prompt).where(Prompt.workspace_id == workspace.id).order_by(Prompt.created_at.asc())
        )
        prompt = prompt_result.scalar_one_or_none()
        
        if not prompt:
            print("ERROR: No prompts found for user")
            return
        
        print(f"Found prompt: {prompt.name} (ID: {prompt.id})")
        
        # Get versions
        versions_result = await db.execute(
            select(PromptVersion).where(PromptVersion.prompt_id == prompt.id).order_by(PromptVersion.version_number.asc())
        )
        versions = versions_result.scalars().all()
        
        if len(versions) < 2:
            print(f"ERROR: Prompt has only {len(versions)} version(s), need at least 2")
            return
        
        version_a = versions[0]
        version_b = versions[1]
        
        print(f"Using versions: v{version_a.version_number} (A) and v{version_b.version_number} (B)")
        
        # Create or find funnel configuration
        funnel_result = await db.execute(
            select(CustomFunnelConfiguration).where(
                CustomFunnelConfiguration.workspace_id == workspace.id,
                CustomFunnelConfiguration.name == "Demo Funnel"
            )
        )
        funnel = funnel_result.scalar_one_or_none()
        
        if not funnel:
            funnel = CustomFunnelConfiguration(
                workspace_id=workspace.id,
                name="Demo Funnel",
                description="Demo funnel for A/B test",
                event_steps=["get_prompt", "get_success", "buy_premium"],
                is_active=True
            )
            db.add(funnel)
            await db.commit()
            await db.refresh(funnel)
            print(f"Created funnel: {funnel.name}")
        else:
            print(f"Using existing funnel: {funnel.name}")
        
        # Create A/B test
        test_name = f"Demo Test {datetime.now().strftime('%Y-%m-%d %H:%M')}"
        ab_test_result = await db.execute(
            select(ABTest).where(
                ABTest.workspace_id == workspace.id,
                ABTest.name == test_name
            )
        )
        ab_test = ab_test_result.scalar_one_or_none()
        
        if not ab_test:
            ab_test = ABTest(
                workspace_id=workspace.id,
                name=test_name,
                prompt_id=prompt.id,
                version_a_id=version_a.id,
                version_b_id=version_b.id,
                total_requests=100,
                version_a_requests=50,
                version_b_requests=50,
                funnel_config_id=funnel.id,
                status='running',
                started_at=datetime.now(timezone.utc) - timedelta(hours=1)
            )
            db.add(ab_test)
            await db.commit()
            await db.refresh(ab_test)
            print(f"Created A/B test: {ab_test.name} (ID: {ab_test.id})")
        else:
            print(f"Using existing A/B test: {ab_test.name}")
        
        # Generate events for version A (lower conversion)
        # Version A: 50 requests, 20 conversions (40% conversion)
        print("\nGenerating events for Version A (40% conversion)...")
        for i in range(50):
            trace_id = str(uuid4())
            created_at = datetime.now(timezone.utc) - timedelta(minutes=60-i)
            
            # get_prompt event
            event1 = PromptEvent(
                workspace_id=workspace.id,
                trace_id=trace_id,
                prompt_id=prompt.id,
                prompt_version_id=version_a.id,
                event_type="prompt_request",
                outcome="success",
                created_at=created_at
            )
            db.add(event1)
            
            # 20 out of 50 get success (40%)
            if i < 20:
                event2 = PromptEvent(
                    workspace_id=workspace.id,
                    trace_id=trace_id,
                    prompt_id=prompt.id,
                    prompt_version_id=version_a.id,
                    event_type="custom_event",
                    event_metadata={"event_name": "get_success"},
                    outcome="success",
                    created_at=created_at + timedelta(seconds=5)
                )
                db.add(event2)
                
                # 10 out of 20 buy premium (50% of conversions, 20% overall)
                if i < 10:
                    event3 = PromptEvent(
                        workspace_id=workspace.id,
                        trace_id=trace_id,
                        prompt_id=prompt.id,
                        prompt_version_id=version_a.id,
                        event_type="custom_event",
                        event_metadata={"event_name": "buy_premium"},
                        outcome="success",
                        created_at=created_at + timedelta(seconds=10)
                    )
                    db.add(event3)
        
        # Generate events for version B (higher conversion)
        # Version B: 50 requests, 30 conversions (60% conversion)
        print("Generating events for Version B (60% conversion)...")
        for i in range(50):
            trace_id = str(uuid4())
            created_at = datetime.now(timezone.utc) - timedelta(minutes=60-i)
            
            # get_prompt event
            event1 = PromptEvent(
                workspace_id=workspace.id,
                trace_id=trace_id,
                prompt_id=prompt.id,
                prompt_version_id=version_b.id,
                event_type="prompt_request",
                outcome="success",
                created_at=created_at
            )
            db.add(event1)
            
            # 30 out of 50 get success (60%)
            if i < 30:
                event2 = PromptEvent(
                    workspace_id=workspace.id,
                    trace_id=trace_id,
                    prompt_id=prompt.id,
                    prompt_version_id=version_b.id,
                    event_type="custom_event",
                    event_metadata={"event_name": "get_success"},
                    outcome="success",
                    created_at=created_at + timedelta(seconds=5)
                )
                db.add(event2)
                
                # 20 out of 30 buy premium (66.7% of conversions, 40% overall)
                if i < 20:
                    event3 = PromptEvent(
                        workspace_id=workspace.id,
                        trace_id=trace_id,
                        prompt_id=prompt.id,
                        prompt_version_id=version_b.id,
                        event_type="custom_event",
                        event_metadata={"event_name": "buy_premium"},
                        outcome="success",
                        created_at=created_at + timedelta(seconds=10)
                    )
                    db.add(event3)
        
        await db.commit()
        print("\n✅ Successfully generated events!")
        print(f"\nA/B Test ID: {ab_test.id}")
        print(f"Version A: 50 requests, 20 conversions (40%)")
        print(f"Version B: 50 requests, 30 conversions (60%)")
        print(f"\nThis should show Winner = B with statistical significance!")

if __name__ == "__main__":
    asyncio.run(main())




