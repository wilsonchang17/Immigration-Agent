from fastapi.testclient import TestClient
import sys
import os

# Add backend to sys.path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

import api
from api import app

client = TestClient(app)

def test_rag_integration_without_local_chroma(monkeypatch):
    """
    Verifies that /validate returns RAG context without requiring a local Chroma index.
    """
    mock_rag_hits = [
        {
            "text": "Post-completion OPT unemployment limit is 90 days.",
            "metadata": {
                "source": "8 CFR 214.2(f)",
                "breadcrumbs": "root > (c)(2)(ii)(E)",
                "original_text": "Student may not accrue more than 90 days of unemployment.",
            },
            "distance": 0.11,
        }
    ]
    monkeypatch.setattr(api, "retrieve_regulations", lambda *_args, **_kwargs: mock_rag_hits)

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
    assert data["rag_warning"] is None
    
    # Check for relevance (keywords)
    combined_text = " ".join([item["text"].lower() for item in rag_context])
    assert "unemployment" in combined_text


def test_pre_completion_returns_timeline_message(monkeypatch):
    monkeypatch.setattr(api, "retrieve_regulations", lambda *_args, **_kwargs: [])

    payload = {
        "degree_level": "Master",
        "is_stem_degree": True,
        "program_end_date": "2026-01-10",
        "opt_stage": "Pre"
    }

    response = client.post("/validate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["timeline"] is None
    assert "Pre-Completion OPT does not use this post-program timeline" in data["timeline_message"]
    assert data["rag_context"] == []
    assert data["rag_warning"] is None


def test_rag_failure_degrades_gracefully(monkeypatch):
    def _raise(*_args, **_kwargs):
        raise RuntimeError("chroma not initialized")

    monkeypatch.setattr(api, "retrieve_regulations", _raise)

    payload = {
        "degree_level": "Master",
        "is_stem_degree": True,
        "program_end_date": "2026-01-10",
        "opt_stage": "Post"
    }

    response = client.post("/validate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "valid"
    assert data["timeline"] is not None
    assert data["rag_context"] == []
    assert "Regulatory references unavailable" in data["rag_warning"]
