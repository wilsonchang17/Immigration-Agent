from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import ValidationError
from models import UserState

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
    Returns the validated UserState if successful.
    Raises 400 with specific error messages if validation fails.
    """
    try:
        # Pydantic does the heavy lifting here based on models.py logic
        user_state = UserState(**data)
        return {"status": "valid", "data": user_state.model_dump()}
    except ValidationError as e:
        # Return a structured list of errors for the frontend to display
        # We simplify the error structure for easier frontend consumption
        errors = []
        for err in e.errors():
            # Customize message based on error type if needed, 
            # but usually err['msg'] from our custom validators is good.
            # We want to map it to fields if possible, or just general errors.
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
