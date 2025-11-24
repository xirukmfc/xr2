"""Generate test data for analytics dashboard"""
import asyncio
from datetime import datetime, timedelta
from uuid import UUID, uuid4
import random
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.prompt import Prompt, PromptVersion
from app.models.analytics import PromptEvent

# Test workspace ID and user ID
WORKSPACE_ID = UUID("03615122-9927-4d54-8db5-912eb1a4202d")
USER_ID = UUID("38a19a81-8681-45e8-bdfa-3701e9fe3909")

# Event types to generate
EVENT_TYPES = [
    ("signup", "conversion"),
    ("purchase", "revenue"),
    ("trial_started", "conversion"),
    ("subscription_upgraded", "revenue"),
    ("feature_used", "engagement"),
    ("onboarding_completed", "conversion"),
]


async def create_test_prompts():
    """Create test prompts with multiple versions"""
    async with AsyncSessionLocal() as db:
        prompts_data = [
            {
                "name": "Welcome Email Generator",
                "slug": "welcome-email-generator",
                "description": "Generates personalized welcome emails",
                "versions": 3
            },
            {
                "name": "Product Description Writer",
                "slug": "product-description-writer",
                "description": "Creates compelling product descriptions",
                "versions": 2
            },
            {
                "name": "Customer Support Assistant",
                "slug": "customer-support-assistant",
                "description": "Helps answer customer questions",
                "versions": 4
            },
        ]

        created_prompts = []

        for prompt_data in prompts_data:
            # Check if prompt already exists
            existing = await db.execute(
                select(Prompt).where(Prompt.slug == prompt_data["slug"])
            )
            existing_prompt = existing.scalar_one_or_none()

            if existing_prompt:
                print(f"Prompt '{prompt_data['name']}' already exists, skipping...")
                created_prompts.append(existing_prompt)
                continue

            # Create prompt
            prompt = Prompt(
                id=uuid4(),
                workspace_id=WORKSPACE_ID,
                name=prompt_data["name"],
                slug=prompt_data["slug"],
                description=prompt_data["description"],
                status="ACTIVE",
                created_by=USER_ID,
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
            db.add(prompt)
            await db.flush()

            # Create versions
            for version_num in range(1, prompt_data["versions"] + 1):
                version = PromptVersion(
                    id=uuid4(),
                    prompt_id=prompt.id,
                    version_number=version_num,
                    system_prompt=f"This is version {version_num} of {prompt_data['name']}",
                    status="PRODUCTION" if version_num == prompt_data["versions"] else "INACTIVE",
                    created_by=USER_ID,
                    created_at=datetime.now() - timedelta(days=30 - version_num * 10),
                    updated_at=datetime.now() - timedelta(days=30 - version_num * 10)
                )
                db.add(version)

            created_prompts.append(prompt)
            print(f"Created prompt: {prompt_data['name']} with {prompt_data['versions']} versions")

        await db.commit()
        return created_prompts


async def create_test_events():
    """Create test events for the prompts"""
    async with AsyncSessionLocal() as db:
        # Get all prompts and their versions
        prompts_result = await db.execute(
            select(Prompt).where(Prompt.workspace_id == WORKSPACE_ID)
        )
        prompts = prompts_result.scalars().all()

        if not prompts:
            print("No prompts found! Create prompts first.")
            return

        events_created = 0

        # Generate events for the last 30 days
        for prompt in prompts:
            # Get versions for this prompt
            versions_result = await db.execute(
                select(PromptVersion).where(PromptVersion.prompt_id == prompt.id)
            )
            versions = versions_result.scalars().all()

            if not versions:
                continue

            print(f"\nGenerating events for: {prompt.name}")

            # Generate events for each day in the last 30 days
            for days_ago in range(30):
                date = datetime.now() - timedelta(days=days_ago)

                # Random number of events per day (0-20)
                num_events = random.randint(0, 20)

                for _ in range(num_events):
                    # Pick random version (weighted towards newer versions)
                    version = random.choices(
                        versions,
                        weights=[1 + i for i in range(len(versions))],
                        k=1
                    )[0]

                    # Pick random event type
                    event_type, category = random.choice(EVENT_TYPES)

                    # Random time during the day
                    event_time = date.replace(
                        hour=random.randint(0, 23),
                        minute=random.randint(0, 59),
                        second=random.randint(0, 59)
                    )

                    # Generate trace_id
                    trace_id = f"{random.randint(100, 999)}_{uuid4().hex[:8]}"

                    # Create prompt_request event first
                    prompt_event = PromptEvent(
                        id=uuid4(),
                        workspace_id=WORKSPACE_ID,
                        trace_id=trace_id,
                        prompt_id=prompt.id,
                        prompt_version_id=version.id,
                        event_type="prompt_request",
                        outcome="success" if random.random() > 0.05 else "failure",
                        event_metadata={
                            "prompt_name": prompt.name,
                            "version_number": version.version_number,
                            "category": "api"
                        },
                        created_at=event_time
                    )
                    db.add(prompt_event)
                    events_created += 1

                    # 30% chance of follow-up custom event
                    if random.random() < 0.3:
                        custom_event_time = event_time + timedelta(minutes=random.randint(1, 60))

                        custom_event = PromptEvent(
                            id=uuid4(),
                            workspace_id=WORKSPACE_ID,
                            trace_id=trace_id,
                            prompt_id=prompt.id,
                            prompt_version_id=version.id,
                            event_type="custom_event",
                            outcome="success" if random.random() > 0.1 else "failure",
                            event_metadata={
                                "event_name": event_type,
                                "category": category,
                                "prompt_name": prompt.name,
                                "version_number": version.version_number,
                            },
                            created_at=custom_event_time
                        )
                        db.add(custom_event)
                        events_created += 1

            print(f"  Generated events for {prompt.name}")

        await db.commit()
        print(f"\n✅ Total events created: {events_created}")


async def main():
    print("🚀 Generating test data...\n")

    print("1️⃣ Creating test prompts...")
    prompts = await create_test_prompts()

    print("\n2️⃣ Creating test events...")
    await create_test_events()

    print("\n✨ Test data generation complete!")


if __name__ == "__main__":
    asyncio.run(main())
