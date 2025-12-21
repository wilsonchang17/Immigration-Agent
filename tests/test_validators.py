import sys
import os
from datetime import date, timedelta
import pytest

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models import UserState, DegreeLevel, OptStage
from validators import (
    validate_standard_opt_eligibility,
    validate_application_timing,
    validate_start_date,
    validate_unemployment_status
)

@pytest.fixture
def base_user():
    # Current mocked date is Dec 20, 2025.
    # Program end must be recent (> 60 days prior triggers error).
    # Let's set program end to Dec 1, 2025.
    return UserState(
        degree_level=DegreeLevel.MASTER,
        is_stem_degree=True,
        program_end_date=date(2025, 12, 1), 
        opt_stage=OptStage.POST_COMPLETION,
        has_one_year_enrollment=True
    )

def test_validate_eligibility(base_user):
    # Case 1: Eligible
    assert not validate_standard_opt_eligibility(base_user)
    
    # Case 2: No 1 year enrollment
    base_user.has_one_year_enrollment = False
    errors = validate_standard_opt_eligibility(base_user)
    assert len(errors) == 1
    assert "one academic year" in errors[0]

def test_validate_application_timing(base_user):
    # Program End: Dec 1, 2025
    # Earliest (-90): Sep 2, 2025 (approx)
    # Latest (+60): Jan 30, 2026 (approx)
    
    # Case 1: Perfect timing
    base_user.application_submission_date = date(2025, 11, 15)
    base_user.i20_issuance_date = date(2025, 11, 1) # 14 days prior
    assert not validate_application_timing(base_user)
    
    # Case 2: Too early
    base_user.application_submission_date = date(2025, 8, 1)
    errors = validate_application_timing(base_user)
    assert any("too early" in e for e in errors)
    
    # Case 3: Too late
    base_user.application_submission_date = date(2026, 3, 1)
    errors = validate_application_timing(base_user)
    assert any("too late" in e for e in errors)
    
    # Case 4: I-20 30-day rule violation (Critical)
    base_user.application_submission_date = date(2025, 12, 15)
    base_user.i20_issuance_date = date(2025, 11, 1) # ~45 days old
    errors = validate_application_timing(base_user)
    assert any("submitted" in e for e in errors) and any("days after I-20" in e for e in errors)
    
    # Case 5: Submitted before I-20 issuance
    base_user.i20_issuance_date = date(2025, 12, 20) # Issued after submission
    errors = validate_application_timing(base_user)
    assert "Application date cannot be before I-20 issuance" in errors[0]

def test_validate_start_date(base_user):
    # Program End: Dec 1, 2025
    # Window: Dec 2, 2025 - Jan 30, 2026 (approx 60 days)
    
    # Case 1: Valid
    base_user.opt_start_date = date(2026, 1, 15)
    assert not validate_start_date(base_user)
    
    # Case 2: Too early (<= program end)
    base_user.opt_start_date = date(2025, 12, 1)
    errors = validate_start_date(base_user)
    assert "must be after" in errors[0]
    
    # Case 3: Too late (> 60 days)
    base_user.opt_start_date = date(2026, 3, 1)
    errors = validate_start_date(base_user)
    assert "more than 60 days" in errors[0]

def test_validate_unemployment_status(base_user):
    # Case 1: Post-Completion limit check
    base_user.opt_stage = OptStage.POST_COMPLETION
    base_user.unemployment_days_used = 90
    assert not validate_unemployment_status(base_user)
    
    base_user.unemployment_days_used = 91
    errors = validate_unemployment_status(base_user)
    assert "exceed the limit of 90 days" in errors[0] 
    # Logic is implemented in validators.py separately now? Or calling model validator?
    # Actually, model validator raises ValueError on instantiation validation, 
    # but validators.py returns list of strings.
    # We are testing validators.py functions here, assuming model creation passed or we bypassed it.
    # Note: If we use UserState constructor, it might raise ValueError if validation is triggered there.
    # `models.py` DOES have check_unemployment_limit in @model_validator(mode='after').
    # So `unemployment_days_used=91` might cause UserState to explode before we reach our validator check
    # IF we construct it with 91.
    # BUT, we are modifying the object `base_user` attribute directly after creation. Pydantic validation runs usually on init/assignment if configured.
    # Let's see if assignment triggers validation by default? Pydantic v2 validates assignment only if validate_assignment=True config.
    # Base configuration default is False. So modifying attribute won't raise, allowing us to test `validate_unemployment_status`.
    
    # Case 2: STEM limit check
    base_user.opt_stage = OptStage.STEM_EXTENSION
    base_user.unemployment_days_used = 150
    assert not validate_unemployment_status(base_user)
    
    base_user.unemployment_days_used = 151
    errors = validate_unemployment_status(base_user)
    assert "exceed the limit of 150 days" in errors[0]
