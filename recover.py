import json
import os

log_path = r'C:\Users\Srijal Seth\.gemini\antigravity-ide\brain\c6fa28ed-4f2d-45f4-b027-c5e6f25257d7\.system_generated\logs\transcript_full.jsonl'

best_code = ""

with open(log_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            entry = json.loads(line)
            if 'tool_calls' in entry:
                for call in entry['tool_calls']:
                    args = call.get('arguments', {})
                    if 'TargetFile' in args and 'LandingPage.jsx' in args['TargetFile']:
                        print(f"Tool: {call['name']}, CodeContent len: {len(args.get('CodeContent', ''))}, TargetContent len: {len(args.get('TargetContent', ''))}, ReplacementContent len: {len(args.get('ReplacementContent', ''))}")
                        
                        # We want the 377 line code.
                        # It was either in CodeContent (if write_to_file was used to create it)
                        if len(args.get('CodeContent', '')) > 5000:
                            best_code = args.get('CodeContent')
                        
                        # Or it was in TargetContent (when I tried to replace it and failed)
                        if len(args.get('TargetContent', '')) > 5000:
                            best_code = args.get('TargetContent')
                            
        except Exception as e:
            pass

if best_code:
    with open(r'd:\Antigravity\Conceptflow\frontend\src\pages\LandingPage.jsx', 'w', encoding='utf-8') as f:
        f.write(best_code)
    print(f'Recovered LandingPage.jsx, length: {len(best_code)}')
else:
    print('No code > 5000 bytes found')
