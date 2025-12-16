from datetime import date, timedelta
from typing import Literal
from pydantic import BaseModel, Field, field_validator, model_validator
from enum import Enum

class DegreeLevel(str, Enum):
    BACHELOR = "Bachelor"
    MASTER = "Master"
    PHD = "PhD"

class OptStage(str, Enum):
    PRE_COMPLETION = "Pre"
    POST_COMPLETION = "Post"
    STEM_EXTENSION = "STEM"

class UserState(BaseModel):
    # Biographical / Academic
    degree_level: DegreeLevel
    is_stem_degree: bool
    
    # Critical Anchors
    program_end_date: date
    
    # OPT Specifics
    opt_stage: OptStage
    unemployment_days_used: int = Field(default=0, ge=0)

    @field_validator("program_end_date")
    @classmethod
    def check_program_end_date(cls, v: date) -> date:
        today = date.today()
        one_year_future = today + timedelta(days=365)
        sixty_days_past = today - timedelta(days=60)

        if v > one_year_future:
            # We'll raise a ValueError as requested, though in real app might be soft warning
            raise ValueError("Program end date is more than 1 year in the future. Please confirm.")
        if v < sixty_days_past:
             raise ValueError("Program end date is more than 60 days in the past. Please confirm.")
        return v

    @model_validator(mode='after')
    def check_stem_eligibility(self) -> 'UserState':
        if self.opt_stage == OptStage.STEM_EXTENSION and not self.is_stem_degree:
            raise ValueError("You cannot apply for STEM Extension without a STEM degree.")
        return self

    @model_validator(mode='after')
    def check_unemployment_limit(self) -> 'UserState':
        limit = 0
        if self.opt_stage == OptStage.POST_COMPLETION:
            limit = 90
        elif self.opt_stage == OptStage.STEM_EXTENSION:
            limit = 150
        
        # If pre-completion, maybe limit is 0? Spec doesn't say, but usually unemployment doesn't apply same way.
        # Focusing on spec rules:
        # Rule 3: Post > 90 -> Error, STEM > 150 -> Error.
        
        if self.opt_stage == OptStage.POST_COMPLETION and self.unemployment_days_used > 90:
            raise ValueError(f"Unemployment days ({self.unemployment_days_used}) exceed the 90-day limit for Post-Completion OPT.")
        
        if self.opt_stage == OptStage.STEM_EXTENSION and self.unemployment_days_used > 150:
            raise ValueError(f"Unemployment days ({self.unemployment_days_used}) exceed the 150-day limit for STEM Extension.")

        return self
