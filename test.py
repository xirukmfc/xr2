# from xr2_sdk import xR2Client

# client = xR2Client(
#       api_key="xr2_prod_YOUR_API_KEY",
#       base_url="http://localhost:8000"
#   )

# Тест 1: check_api_key
# r = client.check_api_key()
# print(r)

# # Тест 2: get_prompt
# r = client.get_prompt(slug="welcome-email-generator")
# print(r)

# # Тест 3: track_event (если есть trace_id)
# if r.ok:
#     e = client.track_event(
#         trace_id=r.data.trace_id,
#         event_name="test_meta",
#         user_id="123",
#         source_name="pip_sdk",
#         metadata=dict(user_name="pavel", product_id="123")
#     )
#     print(e)
 #
 # Тест async версии
 #
import asyncio
from xr2_sdk import AsyncxR2Client
 #
async def test():
  client = AsyncxR2Client(
      api_key="xr2_prod_YOUR_API_KEY",
      base_url="http://localhost:8000"
  )
  try:
      r = await client.check_api_key()
      print(r)
  finally:
      await client.aclose()

asyncio.run(test())

