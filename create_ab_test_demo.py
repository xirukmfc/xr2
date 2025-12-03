#!/usr/bin/env python3
"""
Create a demo A/B test with real events and different conversion rates
"""
import random
import json
from datetime import datetime, timezone
from uuid import uuid4
import psycopg2

# Data from DB
WORKSPACE_ID = "03615122-9927-4d54-8db5-912eb1a4202d"
PROMPT_ID = "f7108c5e-266a-42e5-8985-2baca5329c7a"
VERSION_A_ID = "4a356ee9-bfaa-4660-871a-8a4618e4a25f"  # v1
VERSION_B_ID = "739db5d3-5ff7-4ded-8b5f-9555c37beee9"  # v2
FUNNEL_ID = "ef72c7a1-e30a-40de-93ee-b0d1bec50abc"  # Sales funnel

# Test config
TOTAL_REQUESTS = 200  # Good sample size
VERSION_A_CONVERSION_RATE = 0.25  # 25% conversion for version A
VERSION_B_CONVERSION_RATE = 0.20  # 20% conversion for version B (lower!)

# BUT Version B has HIGHER average purchase amount!
VERSION_A_AVG_AMOUNT = 45.0   # Lower average order value
VERSION_B_AVG_AMOUNT = 89.0   # Higher average order value - better LTV!


def main():
    print("=" * 60)
    print("Creating A/B Test Demo with Different Conversion Rates")
    print("=" * 60)
    
    conn = psycopg2.connect(
        host="localhost",
        database="xr2_db",
        user="xr2_user",
        password="xr2_password"
    )
    cursor = conn.cursor()
    
    # Step 1: Create A/B test directly in DB
    print("\n1. Creating A/B test...")
    test_id = str(uuid4())
    now = datetime.now(timezone.utc)
    
    cursor.execute("""
        INSERT INTO ab_tests 
        (id, workspace_id, name, prompt_id, version_a_id, version_b_id, 
         total_requests, version_a_requests, version_b_requests, 
         funnel_config_id, status, started_at, created_at, updated_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, 0, 0, %s, 'running', %s, %s, %s)
    """, (
        test_id, WORKSPACE_ID, f"Demo: Conversion vs LTV comparison",
        PROMPT_ID, VERSION_A_ID, VERSION_B_ID,
        TOTAL_REQUESTS, FUNNEL_ID, now, now, now
    ))
    print(f"   Created test: {test_id}")
    print(f"   Version A: {VERSION_A_CONVERSION_RATE*100}% conversion, avg ${VERSION_A_AVG_AMOUNT}")
    print(f"   Version B: {VERSION_B_CONVERSION_RATE*100}% conversion, avg ${VERSION_B_AVG_AMOUNT}")
    
    # Step 2: Simulate requests and events
    print(f"\n2. Simulating {TOTAL_REQUESTS} requests with events...")
    
    version_a_requests = 0
    version_b_requests = 0
    version_a_conversions = 0
    version_b_conversions = 0
    
    events_to_insert = []
    
    version_a_total_amount = 0
    version_b_total_amount = 0
    
    for i in range(TOTAL_REQUESTS):
        # Alternate between versions (50/50 split)
        if i % 2 == 0:
            version_id = VERSION_A_ID
            version_a_requests += 1
            convert = random.random() < VERSION_A_CONVERSION_RATE
            avg_amount = VERSION_A_AVG_AMOUNT
            if convert:
                version_a_conversions += 1
        else:
            version_id = VERSION_B_ID
            version_b_requests += 1
            convert = random.random() < VERSION_B_CONVERSION_RATE
            avg_amount = VERSION_B_AVG_AMOUNT
            if convert:
                version_b_conversions += 1
        
        trace_id = f"demo_trace_{uuid4().hex[:16]}"
        session_id = f"session_{uuid4().hex[:8]}"
        event_time = now
        
        # Insert prompt_request event
        events_to_insert.append((
            str(uuid4()),
            WORKSPACE_ID,
            trace_id,
            PROMPT_ID,
            version_id,
            "prompt_request",
            "success",
            session_id,
            None,  # user_id
            '{"event_name": "prompt_request", "category": "api"}',
            None,  # business_metrics
            None,  # error_details
            event_time,
            event_time
        ))
        
        # If converted, add post_message and sign_up events with amount
        if convert:
            # Generate amount with some variance around the average
            amount = round(avg_amount * random.uniform(0.7, 1.3), 2)
            if version_id == VERSION_A_ID:
                version_a_total_amount += amount
            else:
                version_b_total_amount += amount
            
            # post_message event
            events_to_insert.append((
                str(uuid4()),
                WORKSPACE_ID,
                trace_id,
                PROMPT_ID,
                version_id,
                "post_message",
                "success",
                session_id,
                None,
                '{"event_name": "post_message", "category": "engagement"}',
                None,
                None,
                event_time,
                event_time
            ))
            
            # sign_up/purchase event with amount in metadata AND business_metrics
            metadata = json.dumps({
                "event_name": "sign_up", 
                "category": "conversion",
                "amount": amount,
                "product": random.choice(["Basic", "Premium", "Enterprise"])
            })
            business_metrics = json.dumps({"revenue": amount})
            
            events_to_insert.append((
                str(uuid4()),
                WORKSPACE_ID,
                trace_id,
                PROMPT_ID,
                version_id,
                "sign_up",
                "success",
                session_id,
                None,
                metadata,  # Contains amount
                business_metrics,  # Contains revenue
                None,
                event_time,
                event_time
            ))
    
    # Bulk insert events
    print(f"   Inserting {len(events_to_insert)} events...")
    cursor.executemany("""
        INSERT INTO prompt_events 
        (id, workspace_id, trace_id, prompt_id, prompt_version_id, event_type, outcome, 
         session_id, user_id, event_metadata, business_metrics, error_details, created_at, updated_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, events_to_insert)
    
    # Update A/B test counters and complete
    cursor.execute("""
        UPDATE ab_tests 
        SET version_a_requests = %s, 
            version_b_requests = %s,
            status = 'completed',
            ended_at = %s
        WHERE id = %s
    """, (version_a_requests, version_b_requests, now, test_id))
    
    conn.commit()
    cursor.close()
    conn.close()
    
    print(f"\n   Results:")
    print(f"   Version A (v1): {version_a_requests} requests, {version_a_conversions} conversions ({version_a_conversions/version_a_requests*100:.1f}%)")
    print(f"                   Total revenue: ${version_a_total_amount:.2f}, Avg: ${version_a_total_amount/version_a_conversions:.2f}" if version_a_conversions > 0 else "")
    print(f"   Version B (v2): {version_b_requests} requests, {version_b_conversions} conversions ({version_b_conversions/version_b_requests*100:.1f}%)")
    print(f"                   Total revenue: ${version_b_total_amount:.2f}, Avg: ${version_b_total_amount/version_b_conversions:.2f}" if version_b_conversions > 0 else "")
    print(f"\n   💡 Version A has HIGHER conversion but LOWER avg order value")
    print(f"   💡 Version B has LOWER conversion but HIGHER avg order value (better LTV!)")
    
    print("\n" + "=" * 60)
    print("Done! Check the A/B test results in the UI at:")
    print("http://localhost:3002/analytics")
    print("=" * 60)


if __name__ == "__main__":
    main()

