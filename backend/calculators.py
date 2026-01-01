from datetime import date, timedelta
from schemas import OptTimeline

def get_post_completion_opt_timeline(program_end_date: date) -> OptTimeline:
    """
    Projects timeline for Post-Completion OPT.
    
    Logic:
    - earliest_filing_date: Input - 90 days
    - program_end_date: Input (As is)
    - latest_filing_date: Input + 60 days
    - grace_period_end_date: Input + 60 days
    """
    return OptTimeline(
        earliest_filing=program_end_date - timedelta(days=90),
        program_end=program_end_date,
        latest_filing=program_end_date + timedelta(days=60),
        grace_period_end=program_end_date + timedelta(days=60)
    )

def get_stem_opt_timeline(current_opt_end_date: date, original_opt_start_date: date = None) -> OptTimeline:
    """
    Projects timeline for STEM OPT Extension.
    
    Args:
        current_opt_end_date: The expiration date of the current Post-Completion OPT EAD.
        original_opt_start_date: (Optional) The start date of the current OPT period. 
                                 Used to calculate reporting milestones.
    """
    earliest_filing = current_opt_end_date - timedelta(days=90)
    latest_filing = current_opt_end_date
    grace_period_end = current_opt_end_date + timedelta(days=60)
    
    timeline = OptTimeline(
        earliest_filing=earliest_filing,
        program_end=current_opt_end_date,
        latest_filing=latest_filing,
        grace_period_end=grace_period_end
    )
    
    if original_opt_start_date:
        timeline.reporting_period_6_month = original_opt_start_date + timedelta(days=180)
        timeline.reporting_period_12_month = original_opt_start_date + timedelta(days=360)

    return timeline

def get_unemployment_limit_date(opt_start_date: date, max_days: int) -> date:
    """
    Calculates the date by which unemployment days would be exhausted if unemployed since start.
    
    Logic: Input + max_days
    """
    return opt_start_date + timedelta(days=max_days)
