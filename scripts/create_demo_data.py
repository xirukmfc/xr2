"""
Script to create demo data for Product Hunt screenshots.
Run inside Docker container:
    docker exec -it xr2_app_prod python scripts/create_demo_data.py
"""

import asyncio
import uuid
from datetime import datetime, timedelta
import random

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal
from app.models.user import User
from app.models.workspace import Workspace
from app.models.prompt import Prompt, PromptVersion, PromptStatus, VersionStatus
from app.models.analytics import (
    ABTest,
    ConversionFunnel,
    CustomFunnelConfiguration,
    EventDefinition,
    PromptEvent
)


async def get_user_and_workspace(session: AsyncSession, email: str):
    """Get user by email and their workspace"""
    result = await session.execute(
        select(User).where(User.email == email)
    )
    user = result.scalar_one_or_none()

    if not user:
        print(f"User {email} not found!")
        return None, None

    # Get user's workspace (user is owner)
    result = await session.execute(
        select(Workspace)
        .where(Workspace.owner_id == user.id)
        .limit(1)
    )
    workspace = result.scalar_one_or_none()

    return user, workspace


async def create_demo_prompt(session: AsyncSession, user: User, workspace: Workspace):
    """Create a demo prompt with versions for A/B testing"""

    # Check if demo prompt already exists
    result = await session.execute(
        select(Prompt).where(
            Prompt.workspace_id == workspace.id,
            Prompt.slug == "product-recommendations"
        )
    )
    existing = result.scalar_one_or_none()

    if existing:
        print(f"Demo prompt already exists: {existing.id}")
        return existing

    # Create demo prompt
    prompt = Prompt(
        id=uuid.uuid4(),
        name="Product Recommendations",
        slug="product-recommendations",
        description="AI-powered product recommendations for e-commerce",
        status=PromptStatus.ACTIVE,
        workspace_id=workspace.id,
        created_by=user.id,
    )
    session.add(prompt)
    await session.flush()

    # Create Version A (Control) - more formal
    version_a = PromptVersion(
        id=uuid.uuid4(),
        prompt_id=prompt.id,
        version_number=1,
        system_prompt="""You are a professional e-commerce assistant.
Recommend products based on user preferences and browsing history.
Be concise and professional in your recommendations.""",
        user_prompt="User is looking at: {product_name}\nBrowsing history: {history}\n\nRecommend 3 similar products.",
        variables=[
            {"name": "product_name", "type": "string", "required": True},
            {"name": "history", "type": "string", "required": False}
        ],
        status=VersionStatus.PRODUCTION,
        created_by=user.id,
        usage_count=2847,
        deployed_at=datetime.utcnow() - timedelta(days=14),
    )
    session.add(version_a)

    # Create Version B (Variant) - more friendly
    version_b = PromptVersion(
        id=uuid.uuid4(),
        prompt_id=prompt.id,
        version_number=2,
        system_prompt="""You are a friendly shopping buddy!
Help users discover amazing products they'll love.
Be enthusiastic and personal in your recommendations.""",
        user_prompt="Hey! The user is checking out: {product_name}\nThey've been browsing: {history}\n\nWhat 3 products would they absolutely love?",
        variables=[
            {"name": "product_name", "type": "string", "required": True},
            {"name": "history", "type": "string", "required": False}
        ],
        status=VersionStatus.TESTING,
        created_by=user.id,
        usage_count=2853,
    )
    session.add(version_b)
    await session.flush()

    prompt.production_version_id = version_a.id
    prompt.current_version_id = version_b.id

    print(f"Created demo prompt: {prompt.id}")
    print(f"  Version A (Control): {version_a.id}")
    print(f"  Version B (Variant): {version_b.id}")

    return prompt, version_a, version_b


async def create_event_definitions(session: AsyncSession, user: User, workspace: Workspace):
    """Create event definitions for funnel tracking"""

    events = [
        ("product_viewed", "User viewed a product page"),
        ("added_to_cart", "User added product to cart"),
        ("checkout_started", "User started checkout process"),
        ("purchase_completed", "User completed purchase"),
    ]

    created = []
    for event_name, description in events:
        # Check if exists
        result = await session.execute(
            select(EventDefinition).where(
                EventDefinition.workspace_id == workspace.id,
                EventDefinition.event_name == event_name
            )
        )
        existing = result.scalar_one_or_none()

        if existing:
            created.append(existing)
            continue

        event_def = EventDefinition(
            id=uuid.uuid4(),
            workspace_id=workspace.id,
            event_name=event_name,
            description=description,
            metadata_schema=[
                {"name": "user_id", "type": "string", "required": True},
                {"name": "product_id", "type": "string", "required": False},
                {"name": "revenue", "type": "number", "required": False},
            ],
            is_active=True,
            created_by=user.id,
        )
        session.add(event_def)
        created.append(event_def)

    print(f"Created {len(created)} event definitions")
    return created


async def create_custom_funnel(session: AsyncSession, user: User, workspace: Workspace):
    """Create custom funnel configuration for A/B test"""

    # Check if exists
    result = await session.execute(
        select(CustomFunnelConfiguration).where(
            CustomFunnelConfiguration.workspace_id == workspace.id,
            CustomFunnelConfiguration.name == "Purchase Funnel"
        )
    )
    existing = result.scalar_one_or_none()

    if existing:
        print(f"Custom funnel already exists: {existing.id}")
        return existing

    funnel = CustomFunnelConfiguration(
        id=uuid.uuid4(),
        workspace_id=workspace.id,
        name="Purchase Funnel",
        description="Track conversion from product view to purchase",
        event_steps=["product_viewed", "added_to_cart", "checkout_started", "purchase_completed"],
        is_active=True,
        created_by=user.id,
    )
    session.add(funnel)
    await session.flush()

    print(f"Created custom funnel: {funnel.id}")
    return funnel


async def create_conversion_funnel(session: AsyncSession, user: User, workspace: Workspace, prompt: Prompt):
    """Create conversion funnel for the prompt"""

    # Check if exists
    result = await session.execute(
        select(ConversionFunnel).where(
            ConversionFunnel.workspace_id == workspace.id,
            ConversionFunnel.name == "Recommendations to Purchase"
        )
    )
    existing = result.scalar_one_or_none()

    if existing:
        print(f"Conversion funnel already exists: {existing.id}")
        return existing

    funnel = ConversionFunnel(
        id=uuid.uuid4(),
        workspace_id=workspace.id,
        name="Recommendations to Purchase",
        description="Measure how AI recommendations drive purchases",
        source_type="prompt_requests",
        source_prompt_id=prompt.id,
        target_event_name="purchase_completed",
        target_event_category="conversion",
        metric_type="sum",
        metric_field="revenue",
        conversion_window_hours=48,
        is_active=True,
        color="#10B981",
        created_by=user.id,
    )
    session.add(funnel)
    await session.flush()

    print(f"Created conversion funnel: {funnel.id}")
    return funnel


async def create_ab_test(
    session: AsyncSession,
    user: User,
    workspace: Workspace,
    prompt: Prompt,
    version_a: PromptVersion,
    version_b: PromptVersion,
    funnel_config: CustomFunnelConfiguration
):
    """Create A/B test with demo results"""

    # Check if exists
    result = await session.execute(
        select(ABTest).where(
            ABTest.workspace_id == workspace.id,
            ABTest.name == "Tone Experiment: Formal vs Friendly"
        )
    )
    existing = result.scalar_one_or_none()

    if existing:
        print(f"A/B test already exists: {existing.id}")
        return existing

    ab_test = ABTest(
        id=uuid.uuid4(),
        workspace_id=workspace.id,
        name="Tone Experiment: Formal vs Friendly",
        prompt_id=prompt.id,
        version_a_id=version_a.id,
        version_b_id=version_b.id,
        total_requests=6000,
        version_a_requests=2847,
        version_b_requests=2853,
        funnel_config_id=funnel_config.id,
        status="running",
        started_at=datetime.utcnow() - timedelta(days=7),
    )
    session.add(ab_test)
    await session.flush()

    print(f"Created A/B test: {ab_test.id}")
    return ab_test


async def create_demo_events(
    session: AsyncSession,
    workspace: Workspace,
    prompt: Prompt,
    version_a: PromptVersion,
    version_b: PromptVersion,
):
    """Create demo events for funnel visualization"""

    # Check if events already exist
    result = await session.execute(
        select(PromptEvent).where(
            PromptEvent.workspace_id == workspace.id,
            PromptEvent.prompt_id == prompt.id
        ).limit(1)
    )
    if result.scalar_one_or_none():
        print("Demo events already exist, skipping...")
        return

    events_data = [
        # (event_type, count_a, count_b) - Version B should have better conversion
        ("product_viewed", 2847, 2853),      # 100% baseline
        ("added_to_cart", 1139, 1255),       # 40% vs 44%
        ("checkout_started", 569, 684),       # 20% vs 24%
        ("purchase_completed", 427, 570),     # 15% vs 20%
    ]

    created_count = 0

    for event_type, count_a, count_b in events_data:
        # Create events for Version A
        for i in range(min(count_a, 100)):  # Limit to 100 events per type for demo
            days_ago = random.randint(0, 7)
            hours_ago = random.randint(0, 23)

            event = PromptEvent(
                id=uuid.uuid4(),
                workspace_id=workspace.id,
                trace_id=f"trace_a_{event_type}_{i}_{uuid.uuid4().hex[:8]}",
                prompt_id=prompt.id,
                prompt_version_id=version_a.id,
                event_type=event_type,
                outcome="success" if event_type == "purchase_completed" else None,
                session_id=f"session_a_{i % 50}",
                user_id=f"user_a_{i % 200}",
                event_metadata={"variant": "A", "source": "demo"},
                business_metrics={"revenue": random.uniform(29.99, 299.99)} if event_type == "purchase_completed" else None,
                created_at=datetime.utcnow() - timedelta(days=days_ago, hours=hours_ago),
            )
            session.add(event)
            created_count += 1

        # Create events for Version B
        for i in range(min(count_b, 100)):  # Limit to 100 events per type for demo
            days_ago = random.randint(0, 7)
            hours_ago = random.randint(0, 23)

            event = PromptEvent(
                id=uuid.uuid4(),
                workspace_id=workspace.id,
                trace_id=f"trace_b_{event_type}_{i}_{uuid.uuid4().hex[:8]}",
                prompt_id=prompt.id,
                prompt_version_id=version_b.id,
                event_type=event_type,
                outcome="success" if event_type == "purchase_completed" else None,
                session_id=f"session_b_{i % 50}",
                user_id=f"user_b_{i % 200}",
                event_metadata={"variant": "B", "source": "demo"},
                business_metrics={"revenue": random.uniform(29.99, 299.99)} if event_type == "purchase_completed" else None,
                created_at=datetime.utcnow() - timedelta(days=days_ago, hours=hours_ago),
            )
            session.add(event)
            created_count += 1

    print(f"Created {created_count} demo events")


async def main():
    print("=" * 50)
    print("Creating demo data for Product Hunt screenshots")
    print("=" * 50)

    async with AsyncSessionLocal() as session:
        # Get user and workspace
        user, workspace = await get_user_and_workspace(session, "pavel.kuzko@gmail.com")

        if not user or not workspace:
            print("ERROR: User or workspace not found!")
            return

        print(f"\nUser: {user.email}")
        print(f"Workspace: {workspace.name} ({workspace.id})")

        # Create demo prompt with versions
        result = await create_demo_prompt(session, user, workspace)
        if isinstance(result, tuple):
            prompt, version_a, version_b = result
        else:
            # Prompt already exists, get versions
            prompt = result
            result = await session.execute(
                select(PromptVersion)
                .where(PromptVersion.prompt_id == prompt.id)
                .order_by(PromptVersion.version_number)
            )
            versions = result.scalars().all()
            version_a = versions[0] if len(versions) > 0 else None
            version_b = versions[1] if len(versions) > 1 else None

        if not version_a or not version_b:
            print("ERROR: Could not get prompt versions!")
            return

        # Create event definitions
        await create_event_definitions(session, user, workspace)

        # Create custom funnel configuration
        funnel_config = await create_custom_funnel(session, user, workspace)

        # Create conversion funnel
        await create_conversion_funnel(session, user, workspace, prompt)

        # Create A/B test
        await create_ab_test(
            session, user, workspace, prompt,
            version_a, version_b, funnel_config
        )

        # Create demo events
        await create_demo_events(
            session, workspace, prompt, version_a, version_b
        )

        # Commit all changes
        await session.commit()

        print("\n" + "=" * 50)
        print("Demo data created successfully!")
        print("=" * 50)
        print("\nYou can now take screenshots of:")
        print("1. A/B Test Results - /ab-tests")
        print("2. Conversion Funnel - /analytics/funnels")
        print("3. Prompt Editor - /prompts/product-recommendations")


if __name__ == "__main__":
    asyncio.run(main())
