from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import openai
import os
from dotenv import load_dotenv

load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

app = FastAPI()

# Allow CORS for local dev and webapp
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QuoteRequest(BaseModel):
    quote_data: dict

@app.post("/api/quote")
async def get_quote(request: QuoteRequest):
    # Compose prompt for OpenAI
    prompt = f"""
You are a master plumber and quoting specialist. Given the following intake data, generate a summary and recommendations for the technician:
{request.quote_data}
"""
    response = openai.ChatCompletion.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}]
    )
    return {
        "gpt_response": response.choices[0].message.content,
        "input": request.quote_data
    }
