from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import ValidationError
from models import UserState, OptStage
from calculators import get_post_completion_opt_timeline, get_stem_opt_timeline

app = FastAPI()

# Allow CORS for local frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all for development to fix CORS issues
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/validate")
async def validate_user_state(data: dict):
    """
    Validates the user input against the UserState model.
    Returns the validated UserState AND the projected timeline if successful.
    Raises 400 with specific error messages if validation fails.
    """
    try:
        # 1. Validate Input (Pydantic models.py)
        user_state = UserState(**data)
        
        # 2. Calculate Timeline based on the validated state
        timeline = None
        if user_state.opt_stage == OptStage.POST_COMPLETION:
            timeline = get_post_completion_opt_timeline(user_state.program_end_date)
        elif user_state.opt_stage == OptStage.STEM_EXTENSION:
            timeline = get_stem_opt_timeline(user_state.program_end_date)
            
        # 3. Return Unified Response
        return {
            "status": "valid",
            "user_state": user_state.model_dump(),
            "timeline": timeline.model_dump() if timeline else None
        }
    except ValidationError as e:
        errors = []
        for err in e.errors():
            field = loc[-1] if (loc := err.get('loc')) else 'general'
            errors.append({
                "field": str(field),
                "message": err['msg']
            })
        
        raise HTTPException(status_code=400, detail={"status": "invalid", "errors": errors})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
