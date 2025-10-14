#!/usr/bin/env python3
"""
Script to create test prompt events for analytics
"""
import asyncio
import sys
import os
from datetime import datetime, timedelta
import random
from uuid import uuid4

# Add the app directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__)))

from app.core.database import AsyncSessionLocal
from app.models.analytics import PromptEvent
from app.models.workspace import Workspace
from app.models.prompt import Prompt
from sqlalchemy import select


async def create_test_events():
    """Create sample prompt events for analytics"""

    async with AsyncSessionLocal() as session:
        print("Creating test prompt events...")

        # Get first workspace
        workspace_result = await session.execute(
            select(Workspace).limit(1)
        )
        workspace = workspace_result.scalar_one_or_none()
        if not workspace:
            print("No workspace found.")
            return

        workspace_id = workspace.id
        print(f"Using workspace: {workspace.name} ({workspace_id})")

        # Get some prompts
        prompts_result = await session.execute(
            select(Prompt).where(Prompt.workspace_id == workspace_id).limit(5)
        )
        prompts = prompts_result.scalars().all()

        if not prompts:
            print("No prompts found")
            return

        # Create events over the last 7 days
        events_to_create = []
        base_time = datetime.utcnow()

        event_types = ['page_view', 'button_click', 'form_submit', 'purchase', 'signup']

        for i in range(100):  # Create 100 events
            # Random time in the last 7 days
            random_hours = random.randint(0, 7 * 24)
            event_time = base_time - timedelta(hours=random_hours)

            # Random prompt
            prompt = random.choice(prompts)

            # Random event type
            event_type = random.choice(event_types)

            # Random properties
            properties = {
                'page': f'/page-{random.randint(1, 10)}',
                'user_agent': 'test-browser',
                'ip': f'192.168.1.{random.randint(1, 255)}',
                'session_id': str(uuid4()),
                'value': random.randint(1, 1000)
            }

            if event_type == 'purchase':
                properties['amount'] = random.randint(10, 500)
                properties['currency'] = 'USD'
            elif event_type == 'signup':
                properties['plan'] = random.choice(['free', 'pro', 'enterprise'])

            event = PromptEvent(
                workspace_id=workspace_id,
                prompt_id=prompt.id,
                prompt_version_id=None,  # We'll keep it simple
                event_type=event_type,
                event_metadata=properties,
                trace_id=f"trace_{uuid4()}",
                user_id=f"user_{random.randint(1000, 9999)}",
                session_id=properties['session_id'],
                created_at=event_time
            )

            events_to_create.append(event)

        # Batch insert
        session.add_all(events_to_create)
        await session.commit()

        print(f"✅ Created {len(events_to_create)} test events")

        # Create some specific conversion events
        conversion_events = []

        for i in range(20):
            # Create a conversion funnel: page_view -> button_click -> purchase
            session_id = str(uuid4())
            user_id = f"user_{random.randint(1000, 9999)}"
            base_time_conv = base_time - timedelta(hours=random.randint(0, 48))

            # Page view
            page_view = PromptEvent(
                workspace_id=workspace_id,
                prompt_id=random.choice(prompts).id,
                event_type='page_view',
                event_metadata={'page': '/landing', 'session_id': session_id},
                trace_id=f"trace_{uuid4()}",
                user_id=user_id,
                session_id=session_id,
                created_at=base_time_conv
            )
            conversion_events.append(page_view)

            # Button click (5 minutes later)
            button_click = PromptEvent(
                workspace_id=workspace_id,
                prompt_id=random.choice(prompts).id,
                event_type='button_click',
                event_metadata={'button': 'cta-button', 'session_id': session_id},
                trace_id=f"trace_{uuid4()}",
                user_id=user_id,
                session_id=session_id,
                created_at=base_time_conv + timedelta(minutes=5)
            )
            conversion_events.append(button_click)

            # Purchase (10 minutes later, only 60% convert)
            if random.random() < 0.6:
                purchase = PromptEvent(
                    workspace_id=workspace_id,
                    prompt_id=random.choice(prompts).id,
                    event_type='purchase',
                    event_metadata={
                        'amount': random.randint(50, 300),
                        'currency': 'USD',
                        'session_id': session_id
                    },
                    trace_id=f"trace_{uuid4()}",
                    user_id=user_id,
                    session_id=session_id,
                    created_at=base_time_conv + timedelta(minutes=10)
                )
                conversion_events.append(purchase)

        session.add_all(conversion_events)
        await session.commit()

        print(f"✅ Created {len(conversion_events)} conversion events")
        print(f"🎯 Total events created: {len(events_to_create) + len(conversion_events)}")


if __name__ == "__main__":
    asyncio.run(create_test_events())