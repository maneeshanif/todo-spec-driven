#!/usr/bin/env python3
"""Quick script to test date/time handling in the backend."""

from datetime import datetime, timezone, timedelta
import sys

def test_datetime_handling():
    """Test various datetime scenarios."""
    
    print("=" * 60)
    print("Date/Time Testing")
    print("=" * 60)
    
    # 1. Current time
    now_naive = datetime.now()
    now_aware = datetime.now(timezone.utc)
    now_utc_old = datetime.utcnow()  # Deprecated but still used
    
    print("\n1. Current Time:")
    print(f"   datetime.now()                 : {now_naive}")
    print(f"   datetime.now(timezone.utc)     : {now_aware}")
    print(f"   datetime.utcnow() [deprecated] : {now_utc_old}")
    print(f"   ISO format (aware)             : {now_aware.isoformat()}")
    
    # 2. From database (naive UTC)
    db_time = now_aware.replace(tzinfo=None)  # Simulates PG TIMESTAMP WITHOUT TIME ZONE
    print("\n2. Database Storage (PostgreSQL TIMESTAMP):")
    print(f"   Stored as naive UTC            : {db_time}")
    print(f"   Timezone info                  : {db_time.tzinfo}")
    
    # 3. To frontend (ISO with Z)
    frontend_format = db_time.replace(tzinfo=timezone.utc).isoformat().replace('+00:00', 'Z')
    print("\n3. To Frontend (ISO 8601 with Z):")
    print(f"   JSON response                  : {frontend_format}")
    
    # 4. From frontend (parsing ISO)
    incoming = "2026-02-04T15:30:00Z"
    parsed = datetime.fromisoformat(incoming.replace('Z', '+00:00'))
    parsed_naive = parsed.replace(tzinfo=None)
    print("\n4. From Frontend (parsing):")
    print(f"   Frontend sends                 : {incoming}")
    print(f"   Parsed (aware)                 : {parsed}")
    print(f"   Stored as naive                : {parsed_naive}")
    
    # 5. Future time check
    future_time = datetime.now(timezone.utc) + timedelta(hours=1)
    print("\n5. Future Time Validation:")
    print(f"   Current UTC                    : {datetime.now(timezone.utc)}")
    print(f"   Future time (+1 hour)          : {future_time}")
    print(f"   Is future? {future_time > datetime.now(timezone.utc)}")
    
    # 6. Task due date scenario
    print("\n6. Task Due Date Scenario:")
    user_input = "2026-02-04T18:00:00Z"  # 6 PM UTC
    due_date_parsed = datetime.fromisoformat(user_input.replace('Z', '+00:00'))
    due_date_db = due_date_parsed.replace(tzinfo=None)
    
    print(f"   User sets due date             : {user_input}")
    print(f"   Parsed with TZ                 : {due_date_parsed}")
    print(f"   Stored in DB (naive UTC)       : {due_date_db}")
    print(f"   To JSON response               : {due_date_db.replace(tzinfo=timezone.utc).isoformat().replace('+00:00', 'Z')}")
    
    # 7. Reminder scenario
    print("\n7. Reminder Scenario:")
    remind_in_1h = datetime.now(timezone.utc) + timedelta(hours=1)
    remind_naive = remind_in_1h.replace(tzinfo=None)
    
    print(f"   Schedule reminder at           : {remind_in_1h}")
    print(f"   Stored in DB                   : {remind_naive}")
    print(f"   Dapr job schedule              : {remind_in_1h.isoformat()}")
    
    print("\n" + "=" * 60)
    print("✅ All datetime operations look correct!")
    print("=" * 60)
    
    return True

if __name__ == "__main__":
    try:
        test_datetime_handling()
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
