import os
import chromadb
from sentence_transformers import SentenceTransformer

# Configuration
DB_PATH = os.path.join(os.path.dirname(__file__), "chroma_db")
COLLECTION_NAME = "regulations"
EMBEDDING_MODEL_NAME = 'all-MiniLM-L6-v2'

# Global instances for caching
_client = None
_collection = None
_model = None

def get_client_and_collection():
    global _client, _collection
    if _client is None:
        _client = chromadb.PersistentClient(path=DB_PATH)
        _collection = _client.get_collection(name=COLLECTION_NAME)
    return _client, _collection

def get_model():
    global _model
    if _model is None:
        _model = SentenceTransformer(EMBEDDING_MODEL_NAME)
    return _model

def retrieve_regulations(query: str, n_results: int = 5):
    """
    Retrieves the most relevant regulation chunks for a given query.
    Returns a list of dicts with 'text', 'metadata', 'distance'.
    """
    client, collection = get_client_and_collection()
    model = get_model()
    
    query_embedding = model.encode([query]).tolist()
    
    results = collection.query(
        query_embeddings=query_embedding,
        n_results=n_results,
        include=["documents", "metadatas", "distances"]
    )
    
    # Flatten results (chroma returns list of lists)
    hits = []
    if results['documents']:
        for i in range(len(results['documents'][0])):
            hits.append({
                "text": results['documents'][0][i],
                "metadata": results['metadatas'][0][i],
                "distance": results['distances'][0][i]
            })
            
    return hits

if __name__ == "__main__":
    # Simple test
    print("Testing retrieval...")
    q = "unemployment limit for F-1 students"
    hits = retrieve_regulations(q)
    for h in hits:
        print(f"--- (Dist: {h['distance']:.4f}) ---")
        print(h['text'][:200] + "...")
        print(f"Source: {h['metadata']['breadcrumbs']}")
