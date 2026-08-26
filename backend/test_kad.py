import asyncio
import sys
sys.path.append('/Users/youarex/Documents/GitHub/titan-crm/tmp/ru-legal-master/mcps/kad/src')
from kad_mcp.server import get_case_card

async def main():
    try:
        res = await get_case_card('A40-234254/2023')
        print(res)
    except Exception as e:
        print("ERROR:", e)

asyncio.run(main())
