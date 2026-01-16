import os
import re
import chromadb
from bs4 import BeautifulSoup
from sentence_transformers import SentenceTransformer
import uuid

# Configuration
DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "ecfr_full.xml")
DB_PATH = os.path.join(os.path.dirname(__file__), "chroma_db")
COLLECTION_NAME = "regulations"

# Regex patterns for hierarchy markers
# (a)
REGEX_LEVEL_1 = re.compile(r"^\(([a-z]+)\)") 
# (1)
REGEX_LEVEL_2 = re.compile(r"^\(([0-9]+)\)")
# (i), (ii), (iii), (iv) - simple approximation
REGEX_LEVEL_3 = re.compile(r"^\(([ivx]+)\)")
# (A)
REGEX_LEVEL_4 = re.compile(r"^\(([A-Z]+)\)")

def get_marker_level(text):
    """
    Determines the hierarchy level based on the starting marker.
    Returns (level, marker_text) or (None, None).
    Levels:
    1: (a)
    2: (1)
    3: (i)
    4: (A)
    """
    text = text.strip()
    
    # Check Level 4 (A) first, to verify it doesn't conflict with others, 
    # but actually (A) is distinct from (a) case-wise.
    
    # Order matters. 
    # (i) matches [a-z] but we want to catch roman numerals specifically if possible,
    # OR we rely on the implementation plan's hierarchy assumption.
    # Standard CFR is: (a) -> (1) -> (i) -> (A)
    
    # Check Level 3 first (roman numerals) because they look like letters
    m3 = REGEX_LEVEL_3.match(text)
    if m3:
        # Need to be careful. (i) is also valid for Level 1 (a).. but usually CFR starts with (a), (b)...
        # Let's check strict order in the main loop or just prioritized matching.
        # Actually, (i) matches regex for level 1 too.
        # We will assume standard structure.
        return 3, m3.group(0)

    m1 = REGEX_LEVEL_1.match(text)
    if m1:
        # If it matches (i), (v), (x) it might be level 3, but let's see. 
        # The logic needs to be robust. 
        # Wait, REGEX_LEVEL_3 handles (i). 
        # But 'i' is also in [a-z]. 
        # So we need to handle specific roman numerals or rely on context.
        # For this script, we'll try a simplified priority:
        # If it looks like a roman numeral, treat as L3?
        # No, top level can be (i) theoretically but usually starts (a).
        # Let's stick to: Level 1 has precedence if it's not strictly roman?
        # Actually, let's look at the data snippets. 
        # (A)... (B)... (iii)... (iv)... 
        # (23) ... (i) ...
        pass

    m2 = REGEX_LEVEL_2.match(text)
    if m2:
        return 2, m2.group(0)
    
    m4 = REGEX_LEVEL_4.match(text)
    if m4:
        return 4, m4.group(0)
        
    # Re-eval Level 1 vs 3
    # If it is (i), (ii), (iii), treated as Level 3
    if m3: 
        return 3, m3.group(0)
        
    if m1:
        return 1, m1.group(0)

    return None, None

def parse_xml_to_chunks(xml_path):
    with open(xml_path, 'r', encoding='utf-8') as f:
        soup = BeautifulSoup(f, 'xml') # or 'lxml-xml' if installed

    chunks = []
    
    # Context stack: list of (level, marker, text_summary)
    # Initial context
    context_stack = [(0, "root", "8 CFR 214.2(f)")]
    
    # Iterate all Paragraphs
    for p in soup.find_all('P'):
        text = p.get_text().strip()
        if not text:
            continue
            
        # Determine level
        level = None
        marker = None
        
        # Check specific markers
        if REGEX_LEVEL_4.match(text):
            level = 4
            marker = REGEX_LEVEL_4.match(text).group(0)
        elif REGEX_LEVEL_3.match(text):
             # Distinguish (i) from (a)? 
             # In CFR, (a) is usually top, (i) is 3rd.
             # If text starts with (i) or (v) or (x), prefer Level 3?
             # Simple heuristic: If we are deep, it's 3. If we are shallow, it's 1?
             # Let's assume standard hierarchy: (a)(1)(i)(A)
             level = 3
             marker = REGEX_LEVEL_3.match(text).group(0)
        elif REGEX_LEVEL_2.match(text):
            level = 2
            marker = REGEX_LEVEL_2.match(text).group(0)
        elif REGEX_LEVEL_1.match(text):
            # If it captures (i), and we didn't catch it above...
            # This logic is fragile. Let's precise it.
            # If matches (i), (ii), (iii), it IS level 3 by CFR convention.
            # (a) IS level 1.
            val = REGEX_LEVEL_1.match(text).group(1)
            if val in ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x']:
                level = 3
                marker = f"({val})"
            else:
                level = 1
                marker = f"({val})"
        
        if level:
            # Adjust stack
            # Remove items from stack until we find a parent (level < current_level)
            while context_stack and context_stack[-1][0] >= level:
                context_stack.pop()
            
            # Push new context
            # We can use the first few words as summary if needed, or just the marker
            context_stack.append((level, marker, text[:50]))
        
        # Build Breadcrumbs
        breadcrumbs = " > ".join([item[1] for item in context_stack])
        full_context = " > ".join([item[2] for item in context_stack])
        
        # Create Chunk
        # Combine structural context with text for better semantic search
        enriched_text = f"Context: {breadcrumbs}\nText: {text}"
        
        chunks.append({
            "id": str(uuid.uuid4()),
            "text": enriched_text,
            "metadata": {
                "source": "8 CFR 214.2(f)",
                "breadcrumbs": breadcrumbs,
                "original_text": text
            }
        })
        
    return chunks

def main():
    print(f"Loading data from {DATA_PATH}...")
    chunks = parse_xml_to_chunks(DATA_PATH)
    print(f"Generated {len(chunks)} chunks.")
    
    print("Initializing ChromaDB...")
    client = chromadb.PersistentClient(path=DB_PATH)
    collection = client.get_or_create_collection(name=COLLECTION_NAME)
    
    print("Generating Embeddings and Upserting...")
    # Using a local model
    model = SentenceTransformer('all-MiniLM-L6-v2')
    
    batch_size = 50
    for i in range(0, len(chunks), batch_size):
        batch = chunks[i:i+batch_size]
        ids = [c['id'] for c in batch]
        documents = [c['text'] for c in batch]
        metadatas = [c['metadata'] for c in batch]
        
        # Generate embeddings
        embeddings = model.encode(documents).tolist()
        
        collection.upsert(
            ids=ids,
            embeddings=embeddings,
            documents=documents,
            metadatas=metadatas
        )
        print(f"Processed batch {i} - {i+batch_size}")
        
    print("Ingestion Complete!")

if __name__ == "__main__":
    main()
