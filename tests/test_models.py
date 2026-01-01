import os
import sys
# Add parent and backend directory to path
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend"))

from models import UserState, DegreeLevel, OptStage

# Helpers
def today():
    return date.today()

def valid_user_state_dict():
    return {
        "degree_level": DegreeLevel.MASTER,
        "is_stem_degree": True,
        "program_end_date": today(),
        "opt_stage": OptStage.POST_COMPLETION,
        "unemployment_days_used": 0
    }

# --- Happy Path ---
def test_valid_user_state():
    data = valid_user_state_dict()
    user = UserState(**data)
    assert user.degree_level == DegreeLevel.MASTER
    assert user.is_stem_degree is True
    assert user.opt_stage == OptStage.POST_COMPLETION

# --- Date Validation ---
def test_program_end_date_too_far_future():
    data = valid_user_state_dict()
    data["program_end_date"] = today() + timedelta(days=366)
    with pytest.raises(ValidationError) as exc:
        UserState(**data)
    assert "more than 1 year in the future" in str(exc.value)

def test_program_end_date_too_far_past():
    data = valid_user_state_dict()
    data["program_end_date"] = today() - timedelta(days=61)
    with pytest.raises(ValidationError) as exc:
        UserState(**data)
    assert "more than 60 days in the past" in str(exc.value)

# --- STEM Verification ---
def test_stem_extension_requires_stem_degree():
    data = valid_user_state_dict()
    data["opt_stage"] = OptStage.STEM_EXTENSION
    data["is_stem_degree"] = False # Conflict
    with pytest.raises(ValidationError) as exc:
        UserState(**data)
    assert "cannot apply for STEM Extension without a STEM degree" in str(exc.value)

def test_stem_extension_with_stem_degree_ok():
    data = valid_user_state_dict()
    data["opt_stage"] = OptStage.STEM_EXTENSION
    data["is_stem_degree"] = True
    user = UserState(**data)
    assert user.opt_stage == OptStage.STEM_EXTENSION

# --- Unemployment Caps ---
def test_post_completion_unemployment_limit():
    data = valid_user_state_dict()
    data["opt_stage"] = OptStage.POST_COMPLETION
    data["unemployment_days_used"] = 91 # Limit is 90
    with pytest.raises(ValidationError) as exc:
        UserState(**data)
    assert "exceed the 90-day limit" in str(exc.value)

def test_stem_unemployment_limit():
    data = valid_user_state_dict()
    data["opt_stage"] = OptStage.STEM_EXTENSION
    data["is_stem_degree"] = True
    data["unemployment_days_used"] = 151 # Limit is 150
    with pytest.raises(ValidationError) as exc:
        UserState(**data)
    assert "exceed the 150-day limit" in str(exc.value)
