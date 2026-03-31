import os
import json
from datetime import datetime

def generate_manifest(reports_dir='reports', output_file='manifest.json'):
    if not os.path.exists(reports_dir):
        os.makedirs(reports_dir)
        print(f"Created {reports_dir} directory.")
    
    reports = []
    for filename in os.listdir(reports_dir):
        if filename.endswith('.html'):
            filepath = os.path.join(reports_dir, filename)
            stats = os.stat(filepath)
            
            reports.append({
                "name": filename,
                "path": f"reports/{filename}",
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
