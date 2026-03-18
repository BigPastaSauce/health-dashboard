import json, requests, os
from datetime import datetime

# Load Whoop token
token_path = 'C:/Users/clawdbot/Projects/whoop-integration/tokens.json'
with open(token_path) as f:
    token_data = json.load(f)
access_token = token_data['access_token']

headers = {'Authorization': f'Bearer {access_token}'}
BASE = 'https://api.prod.whoop.com/developer/v1'

missing_dates = ['2026-01-01','2026-01-07','2026-01-09','2026-01-17','2026-01-26','2026-01-28','2026-03-10','2026-03-12']

# Load existing unified records
unified_path = 'C:/Users/clawdbot/Projects/health-dashboard/data/unified-records.json'
with open(unified_path, encoding='utf-8-sig') as f:
    records = json.load(f)

existing_dates = {r['date'] for r in records if 'date' in r}
print(f"Existing records: {len(records)}")

for date_str in missing_dates:
    if date_str in existing_dates:
        print(f"{date_str}: already exists, skipping")
        continue
    
    # Query cycles for this date range
    start = f"{date_str}T00:00:00.000Z"
    end = f"{date_str}T23:59:59.999Z"
    
    record = {'date': date_str}
    
    # Get cycle (strain)
    try:
        r = requests.get(f'{BASE}/cycle', headers=headers, params={'start': start, 'end': end})
        if r.status_code == 200:
            cycles = r.json().get('records', [])
            if cycles:
                c = cycles[0]
                score = c.get('score', {})
                record['strain'] = {
                    'strain': score.get('strain'),
                    'calories': score.get('kilojoule', 0) / 4.184 if score.get('kilojoule') else None,
                    'average_heart_rate': score.get('average_heart_rate'),
                    'max_heart_rate': score.get('max_heart_rate'),
                    'kilojoule': score.get('kilojoule')
                }
    except Exception as e:
        print(f"  Cycle error: {e}")
    
    # Get recovery
    try:
        r = requests.get(f'{BASE}/recovery', headers=headers, params={'start': start, 'end': end})
        if r.status_code == 200:
            recoveries = r.json().get('records', [])
            if recoveries:
                rec = recoveries[0]
                score = rec.get('score', {})
                record['recovery'] = {
                    'score': score.get('recovery_score'),
                    'resting_heart_rate': score.get('resting_heart_rate'),
                    'hrv_rmssd_milli': score.get('hrv_rmssd_milli'),
                    'spo2_percentage': score.get('spo2_percentage'),
                    'skin_temp_celsius': score.get('skin_temp_celsius')
                }
    except Exception as e:
        print(f"  Recovery error: {e}")
    
    # Get sleep
    try:
        r = requests.get(f'{BASE}/sleep', headers=headers, params={'start': start, 'end': end})
        if r.status_code == 200:
            sleeps = r.json().get('records', [])
            if sleeps:
                s = sleeps[0]
                score = s.get('score', {})
                stage = score.get('stage_summary', {})
                record['sleep'] = {
                    'total_sleep_hrs': (stage.get('total_light_sleep_time_milli', 0) + stage.get('total_slow_wave_sleep_time_milli', 0) + stage.get('total_rem_sleep_time_milli', 0)) / 3600000,
                    'deep_sleep_hrs': stage.get('total_slow_wave_sleep_time_milli', 0) / 3600000,
                    'rem_sleep_hrs': stage.get('total_rem_sleep_time_milli', 0) / 3600000,
                    'light_sleep_hrs': stage.get('total_light_sleep_time_milli', 0) / 3600000,
                    'total_awake_hrs': stage.get('total_awake_time_milli', 0) / 3600000,
                    'total_in_bed_hrs': stage.get('total_in_bed_time_milli', 0) / 3600000,
                    'sleep_efficiency': score.get('sleep_efficiency_percentage'),
                    'respiratory_rate': score.get('respiratory_rate'),
                    'sleep_consistency': score.get('sleep_consistency_percentage'),
                    'sleep_performance': score.get('sleep_performance_percentage'),
                    'sleep_cycles': stage.get('sleep_cycle_count'),
                    'start': s.get('start'),
                    'end': s.get('end'),
                    'disturbances': stage.get('disturbance_count')
                }
    except Exception as e:
        print(f"  Sleep error: {e}")
    
    # Add body data
    record['body'] = {
        'weight_kg': 111.99196,
        'weight_lbs': 246.9,
        'height_m': 1.7272,
        'max_heart_rate': 188
    }
    
    has_data = 'strain' in record or 'recovery' in record or 'sleep' in record
    if has_data:
        records.append(record)
        print(f"{date_str}: ADDED (strain={'strain' in record}, recovery={'recovery' in record}, sleep={'sleep' in record})")
    else:
        print(f"{date_str}: No data from API")

# Sort by date
records.sort(key=lambda r: r.get('date', ''))
print(f"\nTotal records now: {len(records)}")

# Save
with open(unified_path, 'w', encoding='utf-8') as f:
    json.dump(records, f, ensure_ascii=False)
print("Saved!")
