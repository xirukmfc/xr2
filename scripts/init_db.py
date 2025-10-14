#!/usr/bin/env python3
"""
Initialize database with default LLM providers.
This script should be run after migrations in deployment.

Usage:
    python scripts/init_db.py
    python scripts/init_db.py --update  # Update existing providers
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.scripts.populate_llm_providers import populate_llm_providers
import argparse


def main():
    parser = argparse.ArgumentParser(
        description="Initialize database with default LLM providers"
    )
    parser.add_argument(
        "--update",
        action="store_true",
        help="Update existing providers instead of skipping them"
    )

    args = parser.parse_args()

    print("🚀 Initializing database with LLM providers...\n")

    try:
        result = populate_llm_providers(update_existing=args.update)

        print("\n✅ Database initialization completed successfully!")
        print(f"   Total providers: {result['total']}")
        print(f"   Created: {result['created']}")
        print(f"   Updated: {result['updated']}")
        print(f"   Skipped: {result['skipped']}")

        return 0
    except Exception as e:
        print(f"\n❌ Database initialization failed: {str(e)}")
        return 1


if __name__ == "__main__":
    exit(main())
