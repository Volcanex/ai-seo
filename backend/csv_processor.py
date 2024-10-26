import csv
import os
from urllib.parse import urljoin
from typing import List, Dict

def process_csv(file_path: str, url_column: str, base_url: str = "") -> List[Dict]:
    processed_data = []
    
    with open(file_path, 'r', newline='', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        
        if url_column not in reader.fieldnames:
            raise ValueError(f"URL column '{url_column}' not found in CSV")
        
        for row in reader:
            url = row[url_column]
            if base_url:
                url = urljoin(base_url, url)
            
            processed_row = {
                "url": url,
                "additional_data": {k: v for k, v in row.items() if k != url_column}
            }
            processed_data.append(processed_row)
    
    return processed_data