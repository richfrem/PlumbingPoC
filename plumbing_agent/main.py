import os
from dotenv import load_dotenv
import openai

load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

# Ready-to-use prompt for plumbing intake
prompt = (
    "You are a plumbing intake agent. Ask the user guided questions to qualify their plumbing request. "
    "Return the answers as a JSON object with these fields: name, contact, address, problem_type, urgency, description, preferred_time, photos_requested. "
    "Start by greeting the user and asking for their name."
)

messages = [
    {"role": "system", "content": "You are a helpful plumbing intake agent."},
    {"role": "user", "content": prompt}
]

response = openai.ChatCompletion.create(
    model="gpt-4o-mini",
    messages=messages
)

print("Agent response:")
print(response.choices[0].message.content)
