#!/usr/bin/env python3
"""
Find all ESLint errors in frontend and generate fixes
"""
import subprocess
import json
import re
from pathlib import Path

def run_eslint():
    """Run ESLint and get JSON output"""
    result = subprocess.run(
        ["npx", "eslint", "src", "--ext", ".ts,.tsx", "--format", "json"],
        capture_output=True,
        text=True,
        cwd="/Users/youarex/Documents/GitHub/titan-crm/frontend",
        timeout=120
    )
    return json.loads(result.stdout)

def analyze_errors():
    """Analyze ESLint errors and group by rule and file"""
    try:
        data = run_eslint()
    except Exception as e:
        print(f"Error running ESLint: {e}")
        return None
    
    errors = {}
    warnings = {}
    
    for file_data in data:
        filepath = file_data['filePath'].replace('/Users/youarex/Documents/GitHub/titan-crm/frontend/', '')
        
        for msg in file_data.get('messages', []):
            rule = msg.get('ruleId', 'unknown')
            severity = msg.get('severity')
            line = msg.get('line')
            col = msg.get('column')
            text = msg.get('message')
            
            if severity == 2:  # error
                if rule not in errors:
                    errors[rule] = []
                errors[rule].append({
                    'file': filepath,
                    'line': line,
                    'col': col,
                    'text': text
                })
            elif severity == 1:  # warning
                if rule not in warnings:
                    warnings[rule] = []
                warnings[rule].append({
                    'file': filepath,
                    'line': line,
                    'col': col,
                    'text': text
                })
    
    return errors, warnings

def main():
    print("Analyzing ESLint errors...")
    result = analyze_errors()
    
    if result is None:
        return
    
    errors, warnings = result
    
    print("\n=== ERRORS BY RULE ===\n")
    for rule in sorted(errors.keys(), key=lambda r: -len(errors[r])):
        count = len(errors[rule])
        print(f"{count:3d} {rule}")
        
        # Show first few occurrences
        for i, err in enumerate(errors[rule][:3]):
            print(f"     {err['file']}:{err['line']}")
        
        if len(errors[rule]) > 3:
            print(f"     ... and {len(errors[rule]) - 3} more")
        print()
    
    print(f"\nTOTAL ERRORS: {sum(len(v) for v in errors.values())}")
    print(f"TOTAL WARNINGS: {sum(len(v) for v in warnings.values())}")

if __name__ == "__main__":
    main()
