"""
Fix A/B test events - add prompt_request events and proper funnel events.
Run inside Docker container:
    docker exec xr2_app_prod sh -c 'cd /app && PYTHONPATH=/app python scripts/fix_ab_test_events.py'
"""

import asyncio
import uuid
from datetime import datetime, timedelta
import random

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal
from app.models.user import User
from app.models.workspace import Workspace
from app.models.prompt import Prompt, PromptVersion
from app.models.analytics import ABTest, PromptEvent


async def main():
    print("=" * 50)
    print("Fixing A/B test events for demo")
    print("=" * 50)

    async with AsyncSessionLocal() as session:
        # Get user
        result = await session.execute(
            select(User).where(User.email == "pavel.kuzko@gmail.com")
        )
        user = result.scalar_one_or_none()
        if not user:
            print("User not found!")
            return

        # Get workspace
        result = await session.execute(
            select(Workspace).where(Workspace.owner_id == user.id).limit(1)
        )
        workspace = result.scalar_one_or_none()
        if not workspace:
            print("Workspace not found!")
            return

        print(f"Workspace: {workspace.name} ({workspace.id})")

        # Get the A/B test
        result = await session.execute(
            select(ABTest).where(
                ABTest.workspace_id == workspace.id,
                ABTest.name == "Tone Experiment: Formal vs Friendly"
            )
        )
        ab_test = result.scalar_one_or_none()
        if not ab_test:
            print("A/B test not found!")
            return

        print(f"A/B Test: {ab_test.name} ({ab_test.id})")
        print(f"  Version A: {ab_test.version_a_id}")
        print(f"  Version B: {ab_test.version_b_id}")

        # Get prompt
        result = await session.execute(
            select(Prompt).where(Prompt.id == ab_test.prompt_id)
        )
        prompt = result.scalar_one_or_none()

        # Delete old events for this prompt
        await session.execute(
            delete(PromptEvent).where(PromptEvent.prompt_id == prompt.id)
        )
        print("Deleted old events")

        # Create new events with proper structure
        # Version A: 2847 requests, 15% final conversion (427)
        # Version B: 2853 requests, 20% final conversion (570)

        version_a_requests = 2847
        version_b_requests = 2853

        # Funnel conversion rates (from prompt_request)
        # Version A: 40% -> 50% -> 75% = 15% final
        # Version B: 44% -> 55% -> 82% = 20% final
        funnel_data_a = {
            "product_viewed": int(version_a_requests * 1.0),  # 100% (same as requests)
            "added_to_cart": int(version_a_requests * 0.40),   # 40%
            "checkout_started": int(version_a_requests * 0.20), # 20%
            "purchase_completed": int(version_a_requests * 0.15), # 15%
        }

        funnel_data_b = {
            "product_viewed": int(version_b_requests * 1.0),  # 100%
            "added_to_cart": int(version_b_requests * 0.44),   # 44%
            "checkout_started": int(version_b_requests * 0.24), # 24%
            "purchase_completed": int(version_b_requests * 0.20), # 20%
        }

        created_count = 0
        test_start = ab_test.started_at or (datetime.utcnow() - timedelta(days=7))

        # Create events for Version A
        print(f"\nCreating events for Version A ({version_a_requests} requests)...")
        trace_ids_a = []

        for i in range(version_a_requests):
            trace_id = f"trace_a_{uuid.uuid4().hex[:12]}"
            trace_ids_a.append(trace_id)
            days_ago = random.randint(0, 6)
            hours_ago = random.randint(0, 23)
            event_time = test_start + timedelta(days=days_ago, hours=hours_ago)

            # Create prompt_request event (this is counted as A/B test request)
            event = PromptEvent(
                id=uuid.uuid4(),
                workspace_id=workspace.id,
                trace_id=trace_id,
                prompt_id=prompt.id,
                prompt_version_id=ab_test.version_a_id,
                event_type="prompt_request",
                outcome="success",
                session_id=f"session_a_{i % 100}",
                user_id=f"user_a_{i % 500}",
                event_metadata={
                    "variant": "A",
                    "source": "demo",
                    "prompt_name": prompt.name,
                    "prompt_slug": prompt.slug,
                    "version_number": 1
                },
                created_at=event_time,
            )
            session.add(event)
            created_count += 1

        # Create funnel events for Version A (linked by trace_id)
        for event_name, count in funnel_data_a.items():
            for i in range(min(count, len(trace_ids_a))):
                trace_id = trace_ids_a[i]
                days_ago = random.randint(0, 6)
                hours_ago = random.randint(0, 23)
                event_time = test_start + timedelta(days=days_ago, hours=hours_ago, minutes=random.randint(1, 60))

                event = PromptEvent(
                    id=uuid.uuid4(),
                    workspace_id=workspace.id,
                    trace_id=trace_id,
                    prompt_id=prompt.id,
                    prompt_version_id=ab_test.version_a_id,
                    event_type=event_name,  # Use event name directly as event_type
                    outcome="success" if event_name == "purchase_completed" else None,
                    session_id=f"session_a_{i % 100}",
                    user_id=f"user_a_{i % 500}",
                    event_metadata={
                        "variant": "A",
                        "source": "demo",
                    },
                    business_metrics={"revenue": round(random.uniform(29.99, 199.99), 2)} if event_name == "purchase_completed" else None,
                    created_at=event_time,
                )
                session.add(event)
                created_count += 1

        print(f"  Created {created_count} events for Version A")

        # Create events for Version B
        print(f"\nCreating events for Version B ({version_b_requests} requests)...")
        events_b_count = 0
        trace_ids_b = []

        for i in range(version_b_requests):
            trace_id = f"trace_b_{uuid.uuid4().hex[:12]}"
            trace_ids_b.append(trace_id)
            days_ago = random.randint(0, 6)
            hours_ago = random.randint(0, 23)
            event_time = test_start + timedelta(days=days_ago, hours=hours_ago)

            # Create prompt_request event
            event = PromptEvent(
                id=uuid.uuid4(),
                workspace_id=workspace.id,
                trace_id=trace_id,
                prompt_id=prompt.id,
                prompt_version_id=ab_test.version_b_id,
                event_type="prompt_request",
                outcome="success",
                session_id=f"session_b_{i % 100}",
                user_id=f"user_b_{i % 500}",
                event_metadata={
                    "variant": "B",
                    "source": "demo",
                    "prompt_name": prompt.name,
                    "prompt_slug": prompt.slug,
                    "version_number": 2
                },
                created_at=event_time,
            )
            session.add(event)
            events_b_count += 1

        # Create funnel events for Version B
        for event_name, count in funnel_data_b.items():
            for i in range(min(count, len(trace_ids_b))):
                trace_id = trace_ids_b[i]
                days_ago = random.randint(0, 6)
                hours_ago = random.randint(0, 23)
                event_time = test_start + timedelta(days=days_ago, hours=hours_ago, minutes=random.randint(1, 60))

                event = PromptEvent(
                    id=uuid.uuid4(),
                    workspace_id=workspace.id,
                    trace_id=trace_id,
                    prompt_id=prompt.id,
                    prompt_version_id=ab_test.version_b_id,
                    event_type=event_name,
                    outcome="success" if event_name == "purchase_completed" else None,
                    session_id=f"session_b_{i % 100}",
                    user_id=f"user_b_{i % 500}",
                    event_metadata={
                        "variant": "B",
                        "source": "demo",
                    },
                    business_metrics={"revenue": round(random.uniform(29.99, 199.99), 2)} if event_name == "purchase_completed" else None,
                    created_at=event_time,
                )
                session.add(event)
                events_b_count += 1

        print(f"  Created {events_b_count} events for Version B")

        # Commit
        await session.commit()

        print("\n" + "=" * 50)
        print("Events fixed successfully!")
        print("=" * 50)
        print(f"\nTotal events created: {created_count + events_b_count}")
        print("\nExpected results:")
        print(f"  Version A: {version_a_requests} requests, ~15% conversion ({funnel_data_a['purchase_completed']} purchases)")
        print(f"  Version B: {version_b_requests} requests, ~20% conversion ({funnel_data_b['purchase_completed']} purchases)")
        print("\nNow check: https://xr2.uk/ab-tests")


if __name__ == "__main__":
    asyncio.run(main())
