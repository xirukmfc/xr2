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
    """
    return [
        {
            "name": "openai",
            "display_name": "OpenAI",
            "description": "OpenAI's GPT models for text generation and chat",
            "api_base_url": "https://api.openai.com/v1",
            "is_active": True,
            "models": [
                {"id": "gpt-5", "name": "GPT-5", "description": "Latest GPT-5 model"},
                {"id": "gpt-4.5", "name": "GPT-4.5", "description": "GPT-4.5 advanced model"},
                {"id": "gpt-4o", "name": "GPT-4o", "description": "GPT-4 Optimized"},
                {"id": "gpt-4", "name": "GPT-4", "description": "Standard GPT-4 model"},
                {"id": "gpt-3.5", "name": "GPT-3.5", "description": "Fast and efficient model"},
            ]
        },
        {
            "name": "anthropic",
            "display_name": "Anthropic",
            "description": "Anthropic's Claude models for advanced reasoning",
            "api_base_url": "https://api.anthropic.com/v1",
            "is_active": True,
            "models": [
                {"id": "claude-sonnet-4-5-20250929", "name": "Claude 4.5 Sonnet", "description": "Latest Claude 4.5 Sonnet model"},
                {"id": "claude-opus-4-1-20250805", "name": "Claude 4.1 Opus", "description": "Claude 4.1 Opus for complex tasks"},
                {"id": "claude-opus-4-20250514", "name": "Claude 4 Opus", "description": "Claude 4 Opus"},
                {"id": "claude-3-5-sonnet-20241022", "name": "Claude 3.5 Sonnet", "description": "High-performance balanced model"},
                {"id": "claude-3-7-sonnet-20250219", "name": "Claude 3.7 Sonnet", "description": "Most capable model for complex tasks"},
            ]
        },
        {
            "name": "google",
            "display_name": "Google (DeepMind)",
            "description": "Google's Gemini and PaLM models for multimodal AI",
            "api_base_url": "https://generativelanguage.googleapis.com/v1",
            "is_active": True,
            "models": [
                {"id": "gemini-2.5", "name": "Gemini 2.5", "description": "Latest Gemini 2.5 model"},
                {"id": "gemini-2", "name": "Gemini 2", "description": "Gemini 2 advanced model"},
                {"id": "gemini-1.5-pro", "name": "Gemini 1.5 Pro", "description": "Advanced reasoning and long context"},
                {"id": "gemini-1.5-flash", "name": "Gemini 1.5 Flash", "description": "Fast multimodal model"},
                {"id": "palm-2", "name": "PaLM 2", "description": "Google's PaLM 2 language model"},
            ]
        },
        {
            "name": "xai",
            "display_name": "xAI (Grok)",
            "description": "xAI's Grok models for advanced reasoning and real-time information",
            "api_base_url": "https://api.x.ai/v1",
            "is_active": True,
            "models": [
                {"id": "grok-4", "name": "Grok 4", "description": "Latest Grok 4 model"},
                {"id": "grok-4-heavy", "name": "Grok 4 Heavy", "description": "Grok 4 Heavy for complex reasoning"},
                {"id": "grok-4-fast", "name": "Grok 4 Fast", "description": "Grok 4 Fast for quick responses"},
                {"id": "grok-3", "name": "Grok 3", "description": "Grok 3 standard model"},
                {"id": "grok-3-reasoning", "name": "Grok 3 Reasoning", "description": "Grok 3 optimized for reasoning tasks"},
            ]
        },
        {
            "name": "deepseek",
            "display_name": "DeepSeek",
            "description": "DeepSeek's advanced language and coding models",
            "api_base_url": "https://api.deepseek.com/v1",
            "is_active": True,
            "models": [
                {"id": "deepseek-v3", "name": "DeepSeek-V3", "description": "Latest DeepSeek V3 model"},
                {"id": "deepseek-v2", "name": "DeepSeek-V2", "description": "DeepSeek V2 advanced model"},
                {"id": "deepseek-coder-v2", "name": "DeepSeek-Coder-V2", "description": "DeepSeek Coder V2 for programming"},
                {"id": "deepseek-coder-v1", "name": "DeepSeek-Coder-V1", "description": "DeepSeek Coder V1 for coding tasks"},
                {"id": "deepseek-llm", "name": "DeepSeek-LLM", "description": "DeepSeek general language model"},
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
