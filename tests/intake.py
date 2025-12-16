import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import datetime, date
from pydantic import ValidationError
from models import UserState, DegreeLevel, OptStage

def get_input(prompt: str, required: bool = True) -> str:
    while True:
        value = input(f"{prompt}: ").strip()
        if value or not required:
            return value

def parse_date(date_str: str) -> date:
    try:
        return datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        print("Invalid date format. Please use YYYY-MM-DD.")
        return None

def main():
    print("Welcome to the F1/OPT Immigration Agent Intake (Mock Mode)")
    print("---------------------------------------------------------")
    
    # In a real agent, this would be a loop asking questions one by one.
    # Here we simulate extracting info for all fields.

    try:
        # 1. Degree Level
        print("\nDegree Level (Bachelor, Master, PhD):")
        degree_str = get_input(">>")
        # Simple mapping for mock
        degree_map = {
            "bachelor": DegreeLevel.BACHELOR,
            "master": DegreeLevel.MASTER,
            "phd": DegreeLevel.PHD
        }
        degree = degree_map.get(degree_str.lower())
        if not degree:
            print(f"Invalid degree level. Accepted: {list(degree_map.keys())}")
            return

        # 2. STEM Degree
        print("\nIs this a STEM degree? (yes/no):")
        stem_str = get_input(">>")
        is_stem = stem_str.lower() in ["yes", "y", "true"]

        # 3. Program End Date
        print("\nProgram End Date (YYYY-MM-DD):")
        end_date = None
        while not end_date:
            end_date = parse_date(get_input(">>"))

        # 4. OPT Stage
        print("\nOPT Stage (Pre, Post, STEM):")
        stage_str = get_input(">>")
        stage_map = {
            "pre": OptStage.PRE_COMPLETION,
            "post": OptStage.POST_COMPLETION,
            "stem": OptStage.STEM_EXTENSION
        }
        opt_stage = stage_map.get(stage_str.lower())
        if not opt_stage:
             print(f"Invalid stage. Accepted: {list(stage_map.keys())}")
             return

        # 5. Unemployment Days
        print("\nUnemployment Days Used (0-150):")
        unemployment_str = get_input(">>")
        try:
            unemployment_days = int(unemployment_str)
        except ValueError:
             print("Invalid number.")
             return

        # Attempt to create UserState
        print("\nValidating your information...")
        user_state = UserState(
            degree_level=degree,
            is_stem_degree=is_stem,
            program_end_date=end_date,
            opt_stage=opt_stage,
            unemployment_days_used=unemployment_days
        )
        
        print("\n✅ Success! User State Validated:")
        print(user_state.model_dump_json(indent=2))

    except ValidationError as e:
        print("\n❌ Validation Error:")
        for err in e.errors():
            print(f"- {err['msg']}") # Focusing on the message
    except Exception as e:
        print(f"\n❌ Unexpected Error: {e}")

if __name__ == "__main__":
    main()
