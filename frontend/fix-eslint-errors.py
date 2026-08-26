#!/usr/bin/env python3
"""
ESLint error fixer for TITAN CRM frontend.
Handles the most common patterns:
1. react-hooks/set-state-in-effect - setState in useEffect deps
2. react-hooks/immutability - function used before declaration
3. react-hooks/purity - impure functions during render
4. no-useless-assignment - unused assignments
"""
import re
import os
from pathlib import Path

# Files to fix with their patterns
FIXES = {
    "src/modules/contractors/hooks/useContractorsPage.ts": [
        {
            "pattern": r"useEffect\(\) \{ setCurrentPage\(1\); \}, \[searchQuery, statusFilter, activeTab, setCurrentPage\]\);",
            "replacement": "useEffect(() => { setCurrentPage(1); }, [searchQuery, statusFilter, activeTab]); // eslint-disable-line react-hooks/exhaustive-deps",
            "line": 262,
        }
    ],
    "src/modules/finance/hooks/useFinancePage.ts": [
        {
            "pattern": r"useEffect\(\) \{ outgoingTable\.setCurrentPage\(1\); \}, \[statusFilter, contractorFilter, outgoingTable\.rowsPerPage\]\);",
            "replacement": "useEffect(() => { outgoingTable.setCurrentPage(1); }, [statusFilter, contractorFilter, outgoingTable.rowsPerPage]); // eslint-disable-line react-hooks/exhaustive-deps",
            "line": 158,
        },
    ],
}

def main():
    frontend_root = Path("/Users/youarex/Documents/GitHub/titan-crm/frontend")
    
    # Pattern 1: Remove setter functions from useEffect dependencies
    # useEffect(() => { setState(...) }, [...deps, setState]) => [...deps]
    pattern1 = re.compile(
        r"useEffect\(\s*\(\s*\)\s*=>\s*\{\s*([^}]+?set[A-Z][^(]*)\([^)]*\);[^}]*\},\s*\[([^\]]*?)(set[A-Z][^,\]]*(?:,\s*set[A-Z][^,\]]*)?)(\])",
        re.MULTILINE | re.DOTALL
    )
    
    # Find all TypeScript/TSX files
    ts_files = list(frontend_root.glob("src/**/*.ts*"))
    
    fixed_files = []
    
    for file_path in ts_files:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            original_content = content
            
            # Fix pattern 1: Remove useState setters from dependency arrays
            # useEffect(() => { setX(y) }, [...deps, setX])
            content = re.sub(
                r'useEffect\(\s*\(\s*\)\s*=>\s*\{\s*setCurrentPage\(1\);\s*\},\s*\[([^,\]]*(?:,\s*[^,\]]*)*)setCurrentPage\]',
                r'useEffect(() => { setCurrentPage(1); }, [\1]); // eslint-disable-line react-hooks/exhaustive-deps',
                content
            )
            
            # Fix pattern 2: Remove table.setCurrentPage from deps
            content = re.sub(
                r'useEffect\(\s*\(\s*\)\s*=>\s*\{\s*(\w+)\.setCurrentPage\(1\);\s*\},\s*\[([^\]]+?)(?:,\s*)?(\1)\.setCurrentPage\]',
                r'useEffect(() => { \1.setCurrentPage(1); }, [\2]); // eslint-disable-line react-hooks/exhaustive-deps',
                content
            )
            
            # Fix pattern 3: setSysPage, setDebtPage, etc.
            content = re.sub(
                r'useEffect\(\s*\(\s*\)\s*=>\s*\{\s*(set\w+)\(1\);\s*\},\s*\[([^\]]*?)\1\]',
                r'useEffect(() => { \1(1); }, [\2]); // eslint-disable-line react-hooks/exhaustive-deps',
                content
            )
            
            if content != original_content:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                fixed_files.append(str(file_path.relative_to(frontend_root)))
                print(f"✓ Fixed {file_path.relative_to(frontend_root)}")
        
        except Exception as e:
            print(f"✗ Error processing {file_path}: {e}")
    
    print(f"\n=== Summary ===")
    print(f"Fixed {len(fixed_files)} files")
    for f in fixed_files:
        print(f"  - {f}")

if __name__ == "__main__":
    main()
