
# Project Specification: F1/OPT Immigration Agent - Phase 1

## 1. Project Overview
We are building an "Agentic AI System" to assist international students (F1 Visa) with their OPT (Optional Practical Training) application timeline.
**Phase 1 Goal:** Establish the "Source of Truth" for the user's status through a structured intake process, replacing risky OCR methods with an interactive, strictly validated Q&A flow.

## 2. Tech Stack & Requirements
- **Language:** Python 3.11+
- **Core Library:** Pydantic v2 (Strict typing is mandatory)
- **Framework:** LangGraph (for state management)
- **Validation:** Custom validators within Pydantic models
- **Date Handling:** Standard Python `datetime` (No LLM guessing for dates)

## 3. Data Schema (The Source of Truth)
Define a robust Pydantic model `UserState` that acts as the central state for the user context.

### 3.1 Enums
Use Python `Enum` or `Literal` to restrict inputs:
- `DegreeLevel`: Bachelor, Master, PhD
- `OptStage`: Pre-completion, Post-completion, STEM Extension
- `VisaStatus`: F1 (default)

### 3.2 Core Model: `UserState`
The model must include the following fields with strict types:
```python
from pydantic import BaseModel, Field, field_validator, model_validator
from datetime import date
from typing import Literal

class UserState(BaseModel):
    # Biographical / Academic
    degree_level: Literal["Bachelor", "Master", "PhD"]
    is_stem_degree: bool
    
    # Critical Anchors
    program_end_date: date  # The most critical anchor from I-20
    
    # OPT Specifics
    opt_stage: Literal["Pre", "Post", "STEM"]
    unemployment_days_used: int = Field(default=0, ge=0, le=150)
    
    # Validation Methods (See Section 4)
4. Logic & Validation Rules (Code as Law)
Implement these checks as Pydantic validators (@field_validator or @model_validator).
Rule 1: Program End Date Sanity Check
* The program_end_date should not be ridiculously far in the past or future.
* Logic: If date is > 1 year in the future OR > 60 days in the past, raise a ValueError (or a custom Warning class) asking for confirmation.
* Context: F1 students usually apply around graduation.
Rule 2: STEM Verification
* If opt_stage is "STEM" AND is_stem_degree is False -> Raise ValueError: "You cannot apply for STEM Extension without a STEM degree."
Rule 3: Unemployment Days Cap
* If opt_stage is "Post" and unemployment_days_used > 90 -> Raise ValueError (Violation of status).
* If opt_stage is "STEM" and unemployment_days_used > 150 -> Raise ValueError.
5. Intake Agent Behavior (LangGraph Node)
Create a function/node that simulates an "Intake Interview".
* Input: User text message.
* Output: Updates to UserState.
* Behavior:
    1. Do NOT ask for all information at once.
    2. Ask one question at a time to fill missing fields in UserState.
    3. Tone: Professional, precise, strictly guided.
    4. Parsing: Use an LLM call (e.g., via instructor or structured output) to extract specific fields from user answers into the Pydantic schema.
6. Development Tasks (Step-by-Step)
1. Setup: Create models.py with the Enums and UserState class including all validators.
2. Unit Tests: Write test_models.py to verify:
    * Valid dates pass.
    * Invalid dates trigger errors.
    * Logical conflicts (Non-STEM degree applying for STEM) trigger errors.
	3	Mock Agent: Create a simple script intake.py that mimics the sequential questioning (mocking the LangGraph loop for now) to prove the schema works.


