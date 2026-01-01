from pydantic import BaseModel, Field
from datetime import date
from typing import Optional, List, Tuple, Any, Literal

class OptTimeline(BaseModel):
    earliest_filing: date
    program_end: date
    latest_filing: date
    grace_period_end: date
    
    # STEM Extension specific fields
    reporting_period_6_month: Optional[date] = None
    reporting_period_12_month: Optional[date] = None
    
    # Simple semantic labeling for UI later
    def to_sorted_list(self) -> List[Tuple[date, str]]:
        """Return a list of (date, description) tuples sorted by date."""
        events = [
            (self.earliest_filing, "Earliest Filing Date"),
            (self.program_end, "Program End Date"),
            (self.latest_filing, "Latest Filing Date"),
            (self.grace_period_end, "Grace Period End Date"),
        ]
        
        if self.reporting_period_6_month:
            events.append((self.reporting_period_6_month, "6-Month Reporting Due"))
        if self.reporting_period_12_month:
            events.append((self.reporting_period_12_month, "12-Month Reporting Due"))
            
        return sorted(events, key=lambda x: x[0])

class ValidationErrorDetail(BaseModel):
    field: str
    message: str

class ValidationResponse(BaseModel):
    status: Literal["valid", "invalid"]
    user_state: Optional[Any] = None # Using Any to avoid circular import, or we import later
    timeline: Optional[OptTimeline] = None
    errors: Optional[List[ValidationErrorDetail]] = None
