import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import ValidationError
from models import UserState, OptStage
from calculators import get_post_completion_opt_timeline, get_stem_opt_timeline
from rag import retrieve_regulations

app = FastAPI()

# Allow CORS for local frontend development.
# In production, set ALLOWED_ORIGINS to a comma-separated list.
allowed_origins = [origin.strip() for origin in os.getenv("ALLOWED_ORIGINS", "*").split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
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
        timeline_message = None
        if user_state.opt_stage == OptStage.POST_COMPLETION:
            timeline = get_post_completion_opt_timeline(user_state.program_end_date)
        elif user_state.opt_stage == OptStage.STEM_EXTENSION:
            timeline = get_stem_opt_timeline(user_state.program_end_date)
        else:
            timeline_message = (
                "Pre-Completion OPT does not use this post-program timeline. "
                "Please verify enrollment status and school term dates with your DSO."
            )
            
        # 3. Hybrid Verification via RAG (Retrieve Context)
        rag_query = f"{user_state.opt_stage.value} OPT requirements unemployment limits"
        rag_context = []
        rag_warning = None
        try:
            rag_context = retrieve_regulations(rag_query)
        except Exception:
            # Keep validation available even if the local vector store is not initialized.
            rag_warning = (
                "Regulatory references unavailable. Build local RAG index with "
                "`python backend/ingest_regs.py`."
            )

        # 4. Return Unified Response
        return {
            "status": "valid",
            "user_state": user_state.model_dump(),
            "timeline": timeline.model_dump() if timeline else None,
            "timeline_message": timeline_message,
            "rag_context": rag_context,
            "rag_warning": rag_warning,
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
