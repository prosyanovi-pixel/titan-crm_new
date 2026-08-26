#!/usr/bin/env python3
import json
import sys
import subprocess

# Run ESLint and get JSON output
result = subprocess.run(
    ["npx", "eslint", "src", "--ext", ".ts,.tsx", "--format", "json"],
    capture_output=True,
    text=True
)

try:
    data = json.loads(result.stdout)
except json.JSONDecodeError:
    print("Failed to parse ESLint JSON output")
    sys.exit(1)

errors_by_rule = {}
errors_by_file = {}

for file_data in data:
    filepath = file_data['filePath'].replace('/Users/youarex/Documents/GitHub/titan-crm/frontend/', '')
    for msg in file_data.get('messages', []):
        if msg.get('severity') == 2:  # errors only
            rule = msg.get('ruleId', 'unknown')
            line = msg.get('line')
            
            if rule not in errors_by_rule:
                errors_by_rule[rule] = []
            errors_by_rule[rule].append((filepath, line, msg.get('message')))
            
            if filepath not in errors_by_file:
                errors_by_file[filepath] = []
            errors_by_file[filepath].append((rule, line))

print("=== ERRORS BY RULE (sorted by count) ===\n")
sorted_rules = sorted(errors_by_rule.items(), key=lambda x: -len(x[1]))
for rule, occurrences in sorted_rules:
    count = len(occurrences)
    print(f"{count:3d} {rule}")

print(f"\n=== TOP FILES WITH MOST ERRORS ===\n")
sorted_files = sorted(errors_by_file.items(), key=lambda x: -len(x[1]))
for filepath, errors in sorted_files[:20]:
    count = len(errors)
    print(f"{count:3d} {filepath}")

print(f"\n=== SUMMARY ===")
print(f"Total errors: {sum(len(v) for v in errors_by_rule.values())}")
print(f"Files affected: {len(errors_by_file)}")
print(f"Rule categories: {len(errors_by_rule)}")

# Print details for react-hooks/set-state-in-effect
if 'react-hooks/set-state-in-effect' in errors_by_rule:
    print(f"\n=== react-hooks/set-state-in-effect ({len(errors_by_rule['react-hooks/set-state-in-effect'])}) ===")
    for filepath, line, msg in errors_by_rule['react-hooks/set-state-in-effect'][:10]:
        print(f"  {filepath}:{line}")
