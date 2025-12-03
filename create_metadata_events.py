#!/usr/bin/env python3
"""
Create demo events with rich metadata to demonstrate Metadata Insights
"""
import random
from datetime import datetime, timezone, timedelta
from uuid import uuid4
import psycopg2
import json

# Data from DB
WORKSPACE_ID = "03615122-9927-4d54-8db5-912eb1a4202d"
PROMPT_ID = "f7108c5e-266a-42e5-8985-2baca5329c7a"
VERSION_ID = "c6b3a8b5-b910-4122-aa80-694082330dc4"  # v4 PRODUCTION

# Sample data for realistic metadata
PRODUCTS = ["Premium Plan", "Basic Plan", "Enterprise", "Starter", "Pro"]
COUNTRIES = ["US", "UK", "Germany", "France", "Canada", "Australia"]
SOURCES = ["google", "facebook", "direct", "email", "referral"]
DISCOUNT_CODES = ["SAVE10", "WELCOME20", "SUMMER15", None, None, None]  # 50% have no code

def main():
    print("=" * 60)
    print("Creating Events with Rich Metadata")
    print("=" * 60)
    
    conn = psycopg2.connect(
        host="localhost",
        database="xr2_db",
        user="xr2_user",
        password="xr2_password"
    )
    cursor = conn.cursor()
    
    events_to_insert = []
    now = datetime.now(timezone.utc)
    
    # Create 50 purchase events with metadata
    print("\n1. Creating 50 purchase events with metadata...")
    
    for i in range(50):
        trace_id = f"metadata_demo_{uuid4().hex[:16]}"
        session_id = f"session_{uuid4().hex[:8]}"
        event_time = now - timedelta(hours=random.randint(0, 72))  # Last 3 days
        
        # Generate realistic metadata
        amount = round(random.uniform(29.99, 299.99), 2)
        product = random.choice(PRODUCTS)
        country = random.choice(COUNTRIES)
        source = random.choice(SOURCES)
        discount_code = random.choice(DISCOUNT_CODES)
        
        metadata = {
            "event_name": "purchase",
            "category": "conversion",
            "amount": amount,
            "product": product,
            "country": country,
            "source": source
        }
        
        if discount_code:
            metadata["discount_code"] = discount_code
        
        events_to_insert.append((
            str(uuid4()),
            WORKSPACE_ID,
            trace_id,
            PROMPT_ID,
            VERSION_ID,
            "custom_event",
            "success",
            session_id,
            None,
            json.dumps(metadata),
            json.dumps({"revenue": amount}),
            None,
            event_time,
            event_time
        ))
    
    # Create 30 signup events
    print("2. Creating 30 signup events with metadata...")
    
    PLANS = ["free", "basic", "premium"]
    
    for i in range(30):
        trace_id = f"metadata_demo_{uuid4().hex[:16]}"
        session_id = f"session_{uuid4().hex[:8]}"
        event_time = now - timedelta(hours=random.randint(0, 72))
        
        metadata = {
            "event_name": "signup",
            "category": "conversion",
            "plan": random.choice(PLANS),
            "country": random.choice(COUNTRIES),
            "source": random.choice(SOURCES),
            "referral_bonus": random.randint(0, 20)
        }
        
        events_to_insert.append((
            str(uuid4()),
            WORKSPACE_ID,
            trace_id,
            PROMPT_ID,
            VERSION_ID,
            "custom_event",
            "success",
            session_id,
            None,
            json.dumps(metadata),
            None,
            None,
            event_time,
            event_time
        ))
    
    # Bulk insert events
    print(f"\n3. Inserting {len(events_to_insert)} events into database...")
    
    cursor.executemany("""
        INSERT INTO prompt_events 
        (id, workspace_id, trace_id, prompt_id, prompt_version_id, event_type, outcome, 
         session_id, user_id, event_metadata, business_metrics, error_details, created_at, updated_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, events_to_insert)
    
    conn.commit()
    cursor.close()
    conn.close()
    
    print("\n" + "=" * 60)
    print("Done! Go to Analytics → Prompt Events")
    print("Select 'Welcome Email Generator' prompt to see Metadata Insights:")
    print("")
    print("Numeric fields (aggregations):")
    print("  - amount: Sum, Avg, Min, Max")
    print("  - referral_bonus: Sum, Avg, Min, Max")
    print("")
    print("String fields (segmentation):")
    print("  - product: Premium Plan, Basic Plan, etc.")
    print("  - country: US, UK, Germany, etc.")
    print("  - source: google, facebook, direct, etc.")
    print("  - discount_code: SAVE10, WELCOME20, etc.")
    print("  - plan: free, basic, premium")
    print("=" * 60)


if __name__ == "__main__":
    main()




