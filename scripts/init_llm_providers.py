#!/usr/bin/env python3

import asyncio
import sys
import os
import json

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import AsyncSessionLocal
from app.models.llm import LLMProvider
from sqlalchemy import select


def load_default_providers():
    """Load default providers from JSON file"""
    script_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    json_path = os.path.join(script_dir, "data", "default_llm_providers.json")

    with open(json_path, 'r') as f:
        data = json.load(f)

    return data["llm_providers"]


async def init_llm_providers():
    """Initialize default LLM providers"""
    async with AsyncSessionLocal() as session:
        try:
            providers_data = load_default_providers()
            for provider_data in providers_data:
                # Check if provider already exists
                result = await session.execute(
                    select(LLMProvider).where(LLMProvider.name == provider_data["name"])
                )
                existing_provider = result.scalar_one_or_none()

                if existing_provider:
                    print(f"✅ Provider '{provider_data['name']}' already exists")
                    if existing_provider.models != provider_data["models"]:
                        existing_provider.models = provider_data["models"]
                        print(f"   Updated models for {provider_data['name']}")
                else:
                    # Create new provider
                    new_provider = LLMProvider(
                        name=provider_data["name"],
                        display_name=provider_data["display_name"],
                        description=provider_data["description"],
                        is_active=provider_data["is_active"],
                        api_base_url=provider_data["api_base_url"],
                        models=provider_data["models"]
                    )
                    session.add(new_provider)
                    print(f"✅ Created new provider: {provider_data['name']}")

            await session.commit()
            print("\n🎉 LLM providers initialization completed!")

        except Exception as e:
            print(f"❌ Error initializing providers: {e}")
            await session.rollback()
            raise


if __name__ == "__main__":
    asyncio.run(init_llm_providers())
