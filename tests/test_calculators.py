import sys
import os
from datetime import date, timedelta
import pytest

# Add parent directory to path to import modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from calculators import get_post_completion_opt_timeline, get_stem_opt_timeline, get_unemployment_limit_date

def test_get_post_completion_opt_timeline():
    # Test case from prompt
    # Verify that program_end of 2025-05-15 results in earliest_filing of 2025-02-14.
    program_end = date(2025, 5, 15)
    timeline = get_post_completion_opt_timeline(program_end)
    
    assert timeline.program_end == program_end
    # 2025-05-15 minus 90 days. 
    # Feb has 28 days in 2025.
    # May 15 -> April 15 (30) -> March 15 (31) -> Feb ... 
    # Calculation: 15 + 30 + 31 + 14 = 90?
    # Let's trust assertions.
    assert timeline.earliest_filing == date(2025, 2, 14)
    
    # Check +60 days
    # May 15 + 60 days.
    # May (31-15=16 left), June (30), July (14) -> July 14?
    # 16 + 30 + 14 = 60.
    assert timeline.latest_filing == date(2025, 7, 14)
    assert timeline.grace_period_end == date(2025, 7, 14)

def test_get_stem_opt_timeline():
    current_end = date(2025, 7, 15)
    start_date = date(2024, 7, 16) # Approx 1 year prior
    
    timeline = get_stem_opt_timeline(current_end, original_opt_start_date=start_date)
    
    # Earliest filing: -90 from current end
    # July 15 - 90 days.
    # July 15 (15) + June (30) + May (31) + April (14) = 90?
    # 15 + 30 + 31 + 14 = 90.
    assert timeline.earliest_filing == date(2025, 4, 16)
    
    # Reporting: start + 180 days
    # July 16 + 180 days.
    # approx +6 months = Jan 2025?
    assert timeline.reporting_period_6_month == start_date + timedelta(days=180)
    assert timeline.reporting_period_12_month == start_date + timedelta(days=360)

def test_get_unemployment_limit_date():
    start = date(2025, 1, 1)
    # 90 days limit
    # Jan(31) + Feb(28) + Mar(31) = 90. 
    # Jan 1 + 90 -> April 1?
    limit = get_unemployment_limit_date(start, 90)
    assert limit == date(2025, 4, 1)

