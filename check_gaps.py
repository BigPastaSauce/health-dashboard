import json

with open('C:/Users/clawdbot/Health Data/master-log.json', encoding='utf-8-sig') as f:
    master = json.load(f)
if not isinstance(master, list):
    master = [master]
master_dates = {r.get('date'): r for r in master if r.get('date')}

missing = ['2026-01-01','2026-01-07','2026-01-09','2026-01-17','2026-01-26','2026-01-28','2026-03-10','2026-03-12']
for m in missing:
    if m in master_dates:
        print(f"{m}: found in master-log")
    else:
        print(f"{m}: MISSING everywhere")

print(f"\nMaster-log has {len(master_dates)} dates")
print(f"Master-log date range: {min(master_dates.keys())} to {max(master_dates.keys())}")
