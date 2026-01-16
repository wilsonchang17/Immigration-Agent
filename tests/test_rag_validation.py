from fastapi.testclient import TestClient
import sys
import os

# Add backend to sys.path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from api import app

client = TestClient(app)

def test_rag_integration():
    """
    Verifies that the /validate endpoint returns RAG context.
    """
    payload = {
        "degree_level": "Master",
        "is_stem_degree": True,
        "program_end_date": "2026-01-10",
        "opt_stage": "Post"
    }
    
    response = client.post("/validate", json=payload)
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
    assert response.status_code == 200
    data = response.json()
    
    # Check Basic Structure
    assert data["status"] == "valid"
    assert "timeline" in data
    assert "rag_context" in data
    
    # Check RAG Content
    rag_context = data["rag_context"]
    assert isinstance(rag_context, list)
    assert len(rag_context) > 0
    
    # Check for relevance (keywords)
    # The query is "post_completion OPT requirements unemployment limits"
    # We expect some mention of "unemployment"
    combined_text = " ".join([item["text"].lower() for item in rag_context])
    assert "unemployment" in combined_text
    
    print("\n--- RAG Integration Test Passed ---")
    print("Retrieved Context Snippet:")
    print(rag_context[0]["text"][:100] + "...")

if __name__ == "__main__":
    test_rag_integration()
