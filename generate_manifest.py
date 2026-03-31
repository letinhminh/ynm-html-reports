import os
import json
from datetime import datetime

def generate_manifest(reports_dir='reports', output_file='manifest.json'):
    if not os.path.exists(reports_dir):
        os.makedirs(reports_dir)
        print(f"Created {reports_dir} directory.")
    
    reports = []
    # Use os.walk for recursive scanning
    for root, dirs, files in os.walk(reports_dir):
        for filename in files:
            if filename.endswith('.html'):
                filepath = os.path.join(root, filename)
                stats = os.stat(filepath)
                
                # Get category from the direct parent directory name
                parent_dir = os.path.basename(root)
                category = parent_dir if parent_dir != reports_dir else "General"
                
                reports.append({
                    "name": filename,
                    "path": filepath,
                    "category": category,
                    "size": stats.st_size,
                    "modified": datetime.fromtimestamp(stats.st_mtime).isoformat(),
                    "created": datetime.fromtimestamp(stats.st_ctime).isoformat()
                })
    
    # Sort by modification time (newest first)
    reports.sort(key=lambda x: x['modified'], reverse=True)
    
    with open(output_file, 'w') as f:
        json.dump({"reports": reports, "lastUpdated": datetime.now().isoformat()}, f, indent=4)
    
    print(f"Generated manifest with {len(reports)} reports.")

if __name__ == "__main__":
    generate_manifest()
