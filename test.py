from xr2_sdk import xR2Client

client = xR2Client(api_key="xr2_prod_YOUR_API_KEY")

response = client.get_prompt(slug="humor-vc")
if response:
    # Доступ к данным через .data
    print(response.data.user_prompt)      # "Расскажиу мне шутку про {{topic}}"
    print(response.data.system_prompt)    # "Ты опытный комик из Англии"
    print(response.data.trace_id)         # "evt_b94323da..."
    print(response.data.variables)        # [{'name': 'topic', ...}]
else:
    print(response.error)  # текст ошибки
