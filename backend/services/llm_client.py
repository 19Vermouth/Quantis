import json
from typing import Optional, Dict, Any
from loguru import logger
from groq import AsyncGroq

from core.config import settings


class LLMClient:
    def __init__(self):
        self.client = None
        if settings.groq_api_key:
            self.client = AsyncGroq(api_key=settings.groq_api_key)
            self.model = settings.groq_model

    async def generate(self, system_prompt: str, user_prompt: str, schema: Optional[Dict] = None) -> Dict[str, Any]:
        if not self.client:
            return {"error": "Groq API not configured", "fallback": True}

        try:
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ]

            response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.3,
                max_tokens=800,
                response_format={"type": "json_object"} if schema else {"type": "text"}
            )

            content = response.choices[0].message.content
            return json.loads(content) if content else {}

        except Exception as e:
            logger.error(f"Groq API error: {e}")
            return {"error": str(e), "fallback": True}


llm_client = LLMClient()