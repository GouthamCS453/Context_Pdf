import os
import uuid
from dotenv import load_dotenv
from openai import OpenAI
from pinecone import Pinecone

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")

if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY missing in .env")

if not PINECONE_API_KEY:
    raise ValueError("PINECONE_API_KEY missing in .env")

openai_client = OpenAI(api_key=OPENAI_API_KEY)
pc = Pinecone(api_key=PINECONE_API_KEY)

INDEX_NAME = "pdf-qa-index"
index = pc.Index(INDEX_NAME)



# Embeddings
def generate_embeddings(texts):
    response = openai_client.embeddings.create(
        model="text-embedding-3-small",
        input=texts
    )
    return [item.embedding for item in response.data]



# Store Chunks
def store_chunks(chunks, namespace):
    if not chunks:
        return 0
    try:
        index.delete(delete_all=True, namespace=namespace)
    except Exception:
        pass

    embeddings = generate_embeddings(chunks)

    vectors = []
    for chunk, embedding in zip(chunks, embeddings):
        vectors.append({
            "id": str(uuid.uuid4()),
            "values": embedding,
            "metadata": {
                "text": chunk,
                "source": namespace
            }
        })

    index.upsert(vectors=vectors, namespace=namespace)

    return len(vectors)

# Retrieval
def search_chunks(query, top_k=25):

    query_embedding = generate_embeddings([query])[0]

    results = index.query(
        vector=query_embedding,
        top_k=top_k,
        include_metadata=True
    )

    query_words = set(query.lower().split())
    rescored = []
    seen_texts = set()

    for match in results["matches"]:
        text = match["metadata"]["text"].strip()
        source = match["metadata"].get("source", "Unknown")
        base_score = match["score"]

        if text in seen_texts:
            continue
        seen_texts.add(text)

        boost = 0
        for word in query_words:
            if word in text.lower():
                boost += 0.05

        final_score = base_score + boost
        rescored.append((final_score, source, text))

    rescored.sort(key=lambda x: x[0], reverse=True)

    return rescored[:10]   


def answer_question(query):

    retrieved = search_chunks(query)

    if not retrieved:
        return "Based on the uploaded pdfs I have, I don't have an answer to that question."

    context_blocks = []
    highest_score = 0

    for score, source, text in retrieved:
        highest_score = max(highest_score, score)
        context_blocks.append(f"[Source: {source}]\n{text}")

    # Optional safety threshold
    if highest_score < 0.60:
        return "Based on the uploaded Pdfs I have, I don't have an answer to that question."

    context = "\n\n".join(context_blocks)

    response = openai_client.chat.completions.create(
    model="gpt-3.5-turbo",
    temperature=0,
    max_tokens=600,
    messages=[
    {
        "role": "system",
        "content": (
            "You are a document-grounded assistant similar to NotebookLM.\n"
            "Answer strictly using only the provided context.\n"
            "Do NOT use outside knowledge.\n"
            "If the answer is not present in the context, respond exactly with:\n"
            "Based on the information I have, I don't have an answer to that question.\n\n"
            "When answering:\n"
            "- Provide a complete and detailed explanation.\n"
            "- Include all relevant points from the context.\n"
            "- If multiple items are requested, explain each clearly.\n"
            "- Synthesize information from multiple sections if necessary.\n"
            "- Structure the answer clearly.\n"
        ),
    },
    {
        "role": "user",
        "content": (
            f"Context:\n{context}\n\n"
            f"Question: {query}\n\n"
            "Provide a comprehensive answer."
        ),
    },
]
)

    return response.choices[0].message.content.strip()