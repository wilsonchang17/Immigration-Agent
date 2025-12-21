from datetime import date, timedelta
from typing import List, Optional
from models import UserState, OptStage

def validate_standard_opt_eligibility(user_state: UserState) -> List[str]:
    """
    Checks basic eligibility for Standard Post-Completion OPT.
    """
    errors = []
    if not user_state.has_one_year_enrollment:
        errors.append("Must have been enrolled full-time for at least one academic year.")
    return errors

def validate_application_timing(user_state: UserState, current_date: date = None) -> List[str]:
    """
    Validates the timing of the application submission.
    
    Rules:
    1. Earliest: 90 days before Program End.
    2. Latest: 60 days after Program End.
    3. Critical: Must be submitted within 30 days of I-20 issuance.
    """
    errors = []
    # Default to checking against a provided submission date, or current date if assuming 'now'
    check_date = user_state.application_submission_date or current_date
    
    if not check_date:
        return [] # Cannot validate without a date to check against

    # 1 & 2. Window Check
    earliest_filing = user_state.program_end_date - timedelta(days=90)
    latest_filing = user_state.program_end_date + timedelta(days=60)
    
    if check_date < earliest_filing:
        errors.append(f"Application is too early. Earliest filing date is {earliest_filing}.")
    if check_date > latest_filing:
        errors.append(f"Application is too late. Latest filing date was {latest_filing}.")

    # 3. I-20 30-Day Rule
    if user_state.i20_issuance_date:
        days_diff = (check_date - user_state.i20_issuance_date).days
        if days_diff > 30:
            errors.append(f"CRITICAL: Application submitted {days_diff} days after I-20 issuance. Must be within 30 days.")
        if days_diff < 0:
             errors.append("Application date cannot be before I-20 issuance date.")
            
    return errors

def validate_start_date(user_state: UserState) -> List[str]:
    """
    Validates the requested OPT Start Date.
    
    Rule: Must be within 60 days AFTER Program End Date.
    """
    errors = []
    if not user_state.opt_start_date:
        return []

    earliest_start = user_state.program_end_date + timedelta(days=1) 
    
    latest_start = user_state.program_end_date + timedelta(days=60)
    
    if user_state.opt_start_date <= user_state.program_end_date:
         errors.append("Start date must be after the program end date.")
    
    if user_state.opt_start_date > latest_start:
        errors.append(f"Start date ({user_state.opt_start_date}) is more than 60 days after program end ({user_state.program_end_date}). Limit is {latest_start}.")
        
    return errors

def validate_unemployment_status(user_state: UserState) -> List[str]:
    """
    Validates unemployment limits.
    
    Rules:
    - Standard OPT: Max 90 days.
    - STEM OPT: Max 150 days (total).
    """
    errors = []
    limit = 90
    if user_state.opt_stage == OptStage.STEM_EXTENSION:
        limit = 150
        
    if user_state.unemployment_days_used > limit:
        errors.append(f"Unemployment days used ({user_state.unemployment_days_used}) exceed the limit of {limit} days for {user_state.opt_stage.value} OPT.")
        
    return errors
