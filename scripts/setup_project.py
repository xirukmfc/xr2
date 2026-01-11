#!/usr/bin/env python3

import asyncio
import sys
import os
import subprocess

# Add the parent directory to the path so we can import from the app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import AsyncSessionLocal
from app.models.user import User
from app.core.security import get_password_hash
from sqlalchemy import text
import uuid


def run_sql_commands(commands, db_name="postgres"):
    """Run SQL commands using psql"""
    print(f"🔧 Executing database setup commands...")

    for command in commands:
        try:
            # Run each SQL command
            result = subprocess.run([
                "psql", "-d", db_name, "-c", command
            ], capture_output=True, text=True, check=True)
            print(f"✅ Executed: {command[:50]}...")
        except subprocess.CalledProcessError as e:
            print(f"⚠️  Command may have failed (this might be OK if resource already exists): {command[:50]}...")
            print(f"   Error: {e.stderr}")


def setup_database():
    """Set up the PostgreSQL database and user"""
    print("🗄️  Setting up PostgreSQL database...")

    sql_commands = [
        "CREATE USER xr2_user WITH PASSWORD '***REMOVED_PG_PWD***';",
        "CREATE DATABASE xr2_db OWNER xr2_user;",
        "GRANT ALL PRIVILEGES ON DATABASE xr2_db TO xr2_user;",
        "ALTER USER xr2_user CREATEDB;"
    ]

    run_sql_commands(sql_commands)
    print("✅ Database setup completed!")


async def create_admin_user():
    """Create admin user with username 'WWW' and password '***REMOVED_ADMIN_PWD***'"""
    print("👤 Creating admin user...")

    async with AsyncSessionLocal() as session:
        try:
            # Check if admin user already exists
            result = await session.execute(
                text("SELECT id FROM users WHERE username = :username"),
                {"username": "WWW"}
            )
            existing_user = result.fetchone()

            if existing_user:
                print("✅ Admin user 'WWW' already exists")
                return

            # Create admin user
            hashed_password = get_password_hash("***REMOVED_ADMIN_PWD***")
            admin_user = User(
                id=str(uuid.uuid4()),
                username="WWW",
                email="pavel.kuzko@gmail.com",
                hashed_password=hashed_password,
                is_active=True,
                is_superuser=True
            )

            session.add(admin_user)

            # Check if test user 'eee' already exists
            result_eee = await session.execute(
                text("SELECT id FROM users WHERE username = :username"),
                {"username": "eee"}
            )
            existing_eee = result_eee.fetchone()
            if not existing_eee:
                # Create test user
                hashed_password_eee = get_password_hash("123")
                test_user = User(
                    id=str(uuid.uuid4()),
                    username="eee",
                    email="eee@test.local",
                    hashed_password=hashed_password_eee,
                    is_active=True,
                    is_superuser=False
                )
                session.add(test_user)

            await session.commit()
            print("✅ Created admin user 'WWW' with password '***REMOVED_ADMIN_PWD***'")
            if not existing_eee:
                print("✅ Created test user 'eee' with password '123'")

        except Exception as e:
            print(f"❌ Error creating admin user: {e}")
            await session.rollback()
            raise


async def init_llm_providers():
    """Initialize LLM providers by running the existing script"""
    print("🤖 Initializing LLM providers...")

    try:
        # Run the existing init_llm_providers.py script
        script_path = os.path.join(os.path.dirname(__file__), "init_llm_providers.py")
        result = subprocess.run([sys.executable, script_path],
                                capture_output=True, text=True, check=True)
        print(result.stdout)
        print("✅ LLM providers initialization completed!")
    except subprocess.CalledProcessError as e:
        print(f"❌ Error initializing LLM providers: {e}")
        print(f"   Output: {e.stdout}")
        print(f"   Error: {e.stderr}")
        raise


def run_database_migrations():
    """Run Alembic database migrations"""
    print("🔄 Running database migrations...")

    try:
        # Run alembic upgrade head
        result = subprocess.run(["alembic", "upgrade", "head"],
                                capture_output=True, text=True, check=True)
        print("✅ Database migrations completed!")
    except subprocess.CalledProcessError as e:
        print(f"❌ Error running migrations: {e}")
        print(f"   Output: {e.stdout}")
        print(f"   Error: {e.stderr}")
        raise


async def main():
    """Main setup function"""
    print("🚀 Starting xR2 Project Setup")
    print("=" * 50)

    try:
        # Step 1: Database setup
        setup_database()
        print()

        # Step 2: Run database migrations
        run_database_migrations()
        print()

        # Step 3: Create admin user
        await create_admin_user()
        print()

        # Step 4: Initialize LLM providers
        await init_llm_providers()
        print()

        print("🎉 Project setup completed successfully!")
        print("=" * 50)
        print("📋 Setup Summary:")
        print("   • Database 'xr2_db' created with user 'xr2_user'")
        print("   • Database migrations applied")
        print("   • Admin user 'WWW' created (password: ***REMOVED_ADMIN_PWD***)")
        print("   • LLM providers initialized")
        print()
        print("🚀 You can now start the application with: ./start.sh")

    except Exception as e:
        print(f"❌ Setup failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
