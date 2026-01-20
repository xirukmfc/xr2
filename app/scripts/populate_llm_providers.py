"""
Script to populate LLM providers with popular models.
Can be run as a standalone script or imported as a function.
"""

from sqlalchemy.orm import Session
from app.core.database import SyncSessionLocal

# Import all models to avoid relationship errors
import app.models  # noqa
from app.models.llm import LLMProvider


def get_popular_providers():
    """
    Returns a list of popular LLM providers with their current models.
    Update this list periodically to keep models current.
    Last updated: January 2026
    """
    return [
        {
            "name": "openai",
            "display_name": "OpenAI",
            "description": "OpenAI GPT and reasoning models including GPT-5.x, GPT-4.1, and o-series",
            "api_base_url": "https://api.openai.com/v1",
            "is_active": True,
            "models": [
                {"id": "gpt-5.2", "name": "GPT-5.2", "description": "Latest GPT-5.2 model"},
                {"id": "gpt-5.1", "name": "GPT-5.1", "description": "GPT-5.1 model"},
                {"id": "gpt-5", "name": "GPT-5", "description": "GPT-5 base model"},
                {"id": "gpt-5-mini", "name": "GPT-5 Mini", "description": "Compact GPT-5 model"},
                {"id": "o3-pro", "name": "o3-pro", "description": "o3-pro reasoning model (no temperature control)"},
                {"id": "o3", "name": "o3", "description": "o3 reasoning model (no temperature control)"},
                {"id": "o3-mini", "name": "o3-mini", "description": "o3-mini compact reasoning model (no temperature control)"},
                {"id": "o4-mini", "name": "o4-mini", "description": "o4-mini compact reasoning model (no temperature control)"},
                {"id": "o1-pro", "name": "o1-pro", "description": "o1-pro advanced reasoning model (no temperature control)"},
                {"id": "o1", "name": "o1", "description": "o1 reasoning model (no temperature control)"},
                {"id": "o1-mini", "name": "o1-mini", "description": "o1-mini compact reasoning model (no temperature control)"},
                {"id": "gpt-4.1", "name": "GPT-4.1", "description": "GPT-4.1 advanced model"},
                {"id": "gpt-4.1-mini", "name": "GPT-4.1 Mini", "description": "GPT-4.1 compact model"},
                {"id": "gpt-4.1-nano", "name": "GPT-4.1 Nano", "description": "GPT-4.1 ultralight model"},
                {"id": "gpt-4o", "name": "GPT-4o", "description": "GPT-4 Optimized"},
                {"id": "gpt-4o-mini", "name": "GPT-4o Mini", "description": "GPT-4o compact model"},
            ]
        },
        {
            "name": "anthropic",
            "display_name": "Anthropic",
            "description": "Claude AI models from Anthropic including Claude 4.x family",
            "api_base_url": "https://api.anthropic.com/v1",
            "is_active": True,
            "models": [
                {"id": "claude-opus-4.5", "name": "Claude 4.5 Opus", "description": "Most capable Claude model"},
                {"id": "claude-sonnet-4.5", "name": "Claude 4.5 Sonnet", "description": "Balanced Claude 4.5 model"},
                {"id": "claude-haiku-4.5", "name": "Claude 4.5 Haiku", "description": "Fast Claude 4.5 model"},
                {"id": "claude-opus-4.1", "name": "Claude 4.1 Opus", "description": "Claude 4.1 Opus for complex tasks"},
                {"id": "claude-sonnet-4", "name": "Claude 4 Sonnet", "description": "Claude 4 Sonnet balanced model"},
                {"id": "claude-opus-4", "name": "Claude 4 Opus", "description": "Claude 4 Opus"},
                {"id": "claude-3.7-sonnet", "name": "Claude 3.7 Sonnet", "description": "Claude 3.7 Sonnet"},
                {"id": "claude-3.5-sonnet", "name": "Claude 3.5 Sonnet", "description": "High-performance balanced model"},
                {"id": "claude-3.5-haiku", "name": "Claude 3.5 Haiku", "description": "Fast Claude 3.5 model"},
            ]
        },
        {
            "name": "google",
            "display_name": "Google AI",
            "description": "Google Gemini models including 3.0 Pro, 2.5 Pro and Flash variants",
            "api_base_url": "https://generativelanguage.googleapis.com/v1",
            "is_active": True,
            "models": [
                {"id": "gemini-3-pro", "name": "Gemini 3 Pro", "description": "Latest Gemini 3 Pro model"},
                {"id": "gemini-2.5-pro", "name": "Gemini 2.5 Pro", "description": "Advanced Gemini 2.5 Pro"},
                {"id": "gemini-2.5-flash", "name": "Gemini 2.5 Flash", "description": "Fast Gemini 2.5 Flash"},
                {"id": "gemini-2.5-flash-lite", "name": "Gemini 2.5 Flash Lite", "description": "Lightweight Gemini 2.5"},
                {"id": "gemini-2.0-flash", "name": "Gemini 2.0 Flash", "description": "Gemini 2.0 Flash"},
                {"id": "gemini-2.0-flash-lite", "name": "Gemini 2.0 Flash Lite", "description": "Lightweight Gemini 2.0"},
            ]
        },
        {
            "name": "xai",
            "display_name": "xAI (Grok)",
            "description": "Grok models from xAI with real-time knowledge",
            "api_base_url": "https://api.x.ai/v1",
            "is_active": True,
            "models": [
                {"id": "grok-4", "name": "Grok 4", "description": "Latest Grok 4 model"},
                {"id": "grok-4-fast", "name": "Grok 4 Fast", "description": "Grok 4 optimized for speed"},
                {"id": "grok-3", "name": "Grok 3", "description": "Grok 3 standard model"},
                {"id": "grok-3-mini", "name": "Grok 3 Mini", "description": "Compact Grok 3 model"},
                {"id": "grok-2", "name": "Grok 2", "description": "Grok 2 legacy model"},
            ]
        },
        {
            "name": "deepseek",
            "display_name": "DeepSeek",
            "description": "DeepSeek AI models with advanced reasoning capabilities",
            "api_base_url": "https://api.deepseek.com/v1",
            "is_active": True,
            "models": [
                {"id": "deepseek-chat", "name": "DeepSeek Chat (V3)", "description": "Latest DeepSeek V3 chat model"},
                {"id": "deepseek-reasoner", "name": "DeepSeek Reasoner", "description": "DeepSeek reasoning model"},
            ]
        },
    ]


def populate_llm_providers(session: Session = None, update_existing: bool = False):
    """
    Populate the database with popular LLM providers.

    Args:
        session: SQLAlchemy session (optional, will create one if not provided)
        update_existing: If True, update existing providers; if False, skip existing ones

    Returns:
        dict: Summary of the operation
    """
    close_session = False
    if session is None:
        session = SyncSessionLocal()
        close_session = True

    try:
        providers_data = get_popular_providers()
        created_count = 0
        updated_count = 0
        skipped_count = 0

        for provider_data in providers_data:
            # Check if provider already exists
            existing_provider = session.query(LLMProvider).filter(
                LLMProvider.name == provider_data["name"]
            ).first()

            if existing_provider:
                if update_existing:
                    # Update existing provider
                    for key, value in provider_data.items():
                        setattr(existing_provider, key, value)
                    updated_count += 1
                    print(f"✓ Updated provider: {provider_data['display_name']}")
                else:
                    skipped_count += 1
                    print(f"⊘ Skipped existing provider: {provider_data['display_name']}")
            else:
                # Create new provider
                new_provider = LLMProvider(**provider_data)
                session.add(new_provider)
                created_count += 1
                print(f"✓ Created provider: {provider_data['display_name']}")

        session.commit()

        summary = {
            "created": created_count,
            "updated": updated_count,
            "skipped": skipped_count,
            "total": len(providers_data)
        }

        print(f"\n📊 Summary:")
        print(f"   Created: {created_count}")
        print(f"   Updated: {updated_count}")
        print(f"   Skipped: {skipped_count}")
        print(f"   Total processed: {len(providers_data)}")

        return summary

    except Exception as e:
        session.rollback()
        print(f"❌ Error: {str(e)}")
        raise
    finally:
        if close_session:
            session.close()


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Populate LLM providers in the database")
    parser.add_argument(
        "--update",
        action="store_true",
        help="Update existing providers instead of skipping them"
    )

    args = parser.parse_args()

    print("🚀 Populating LLM providers...\n")
    populate_llm_providers(update_existing=args.update)
    print("\n✅ Done!")
