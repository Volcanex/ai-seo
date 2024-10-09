import pandas as pd
import requests
from bs4 import BeautifulSoup
import json
import os
import re
from urllib.parse import urljoin, urlparse
from datetime import datetime
import matplotlib.pyplot as plt
import numpy as np

# Constants
SITE = "svea.com"
BASE_URL = "https://" + SITE
CSV_FILE = SITE + ".csv"
OUTPUT_FOLDER = "scraped_data_" + SITE
LIVE_SITE_FILE = "live_site_" + SITE + ".json"

def load_from_csv(file_path):
    """Load CSV data into a pandas DataFrame and save as JSON."""
    df = pd.read_csv(file_path)
    df.columns = [
        'Landing page', 'Total sessions', 'GPT Sessions', 'Active users',
        'New users', 'Average engagement time per session', 'Key events',
        'Total revenue', 'Sessions per active user', 'Session key event rate'
    ]

    df.to_json(LIVE_SITE_FILE, orient='records', indent=2)
    print(f"Data loaded from CSV and saved to {LIVE_SITE_FILE}")
    return df

def load_from_json(file_path):
    """Load JSON data into a pandas DataFrame."""
    with open(file_path, 'r') as f:
        data = json.load(f)
    return pd.DataFrame(data)

def get_site_list(df):
    """Extract the list of URLs from the DataFrame."""
    return [urljoin(BASE_URL, path) for path in df['Landing page']]

def scrape_seo_data(url):
    """Scrape comprehensive SEO-relevant data from a given URL."""
    try:
        response = requests.get(url)
        soup = BeautifulSoup(response.text, 'html.parser')

        # Basic SEO data
        title = soup.title.string if soup.title else 'Not found'
        h1 = soup.find('h1').text if soup.find('h1') else 'Not found'
        canonical = soup.find('link', {'rel': 'canonical'})
        canonical = canonical['href'] if canonical else 'Not found'

        # Collect all meta tags
        meta_tags = {}
        for tag in soup.find_all('meta'):
            name = tag.get('name') or tag.get('property')
            if name:
                meta_tags[name] = tag.get('content')

        # Extract specific meta tags
        description = meta_tags.get('description', 'Not found')
        robots = meta_tags.get('robots', 'Not found')
        og_title = meta_tags.get('og:title', 'Not found')
        og_description = meta_tags.get('og:description', 'Not found')

        # Attempt to find publication date
        pub_date = meta_tags.get('article:published_time') or meta_tags.get('date') or 'Not found'

        # Additional SEO data
        word_count = len(soup.get_text().split())
        internal_links = len([a for a in soup.find_all('a', href=True) if urlparse(a['href']).netloc == '' or urlparse(a['href']).netloc == SITE])
        external_links = len([a for a in soup.find_all('a', href=True) if urlparse(a['href']).netloc != '' and urlparse(a['href']).netloc != SITE])
        img_count = len(soup.find_all('img'))
        img_alt_count = len([img for img in soup.find_all('img') if img.get('alt')])

        # Headings count
        headings = {f'h{i}': len(soup.find_all(f'h{i}')) for i in range(1, 7)}

        # Schema.org structured data
        schema_data = [script.string for script in soup.find_all('script', type='application/ld+json')]

        # Extract all text content
        text_content = ' '.join([element.get_text(strip=True) for element in soup.find_all(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'span', 'div'])])

        return {
            "url": url,
            "title": title,
            "h1": h1,
            "canonical": canonical,
            "meta_description": description,
            "robots": robots,
            "og_title": og_title,
            "og_description": og_description,
            "publication_date": pub_date,
            "word_count": word_count,
            "internal_links": internal_links,
            "external_links": external_links,
            "image_count": img_count,
            "images_with_alt": img_alt_count,
            "headings": headings,
            "schema_data": schema_data,
            "meta_tags": meta_tags,
            "text_content": text_content,
            "scraped_at": datetime.now().isoformat()
        }
    except Exception as e:
        print(f"Error scraping {url}: {str(e)}")
        return None

def scrape_and_save(url_list):
    """Scrape SEO data from each URL and save as JSON."""
    if not os.path.exists(OUTPUT_FOLDER):
        os.makedirs(OUTPUT_FOLDER)

    all_data = []
    for url in url_list:
        data = scrape_seo_data(url)
        if data:
            all_data.append(data)
            
            # Save individual JSON file
            file_name = url.replace(BASE_URL, '').replace('/', '_') + '.json'
            file_path = os.path.join(OUTPUT_FOLDER, file_name)
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)

            print(f"Scraped and saved: {url}")

    # Update DataFrame with scraped data
    df = pd.DataFrame(all_data)
    df.to_json(LIVE_SITE_FILE, orient='records', indent=2)
    print(f"Updated data saved to {LIVE_SITE_FILE}")

def view_sorted_data(df):
    """View data sorted by a specified column."""
    print("\nAvailable columns:")
    for i, col in enumerate(df.columns):
        print(f"{i}: {col}")
    
    try:
        col_num = int(input("Enter the number of the column to sort by: "))
        col_name = df.columns[col_num]
        sorted_df = df.sort_values(by=col_name)
        print(sorted_df.to_string())
    except (ValueError, IndexError):
        print("Invalid column number. Please try again.")

def visualize_data(df):
    """Visualize data as a sorted table using matplotlib."""
    print("\nAvailable columns:")
    for i, col in enumerate(df.columns):
        print(f"{i}: {col}")
    
    try:
        col_num = int(input("Enter the number of the column to sort by: "))
        col_name = df.columns[col_num]
        
        # Sort the dataframe by the selected column
        sorted_df = df.sort_values(by=col_name, ascending=False)
        
        # Select top 10 rows for better visibility
        display_df = sorted_df.head(10)
        
        # Create a figure and axis
        fig, ax = plt.subplots(figsize=(12, 6))
        ax.axis('off')
        
        # Create the table
        table = ax.table(cellText=display_df.values,
                         colLabels=display_df.columns,
                         cellLoc='center',
                         loc='center')
        
        # Adjust table style
        table.auto_set_font_size(False)
        table.set_fontsize(9)
        table.scale(1.2, 1.5)
        
        # Set title
        plt.title(f"Top 10 Pages Sorted by {col_name}", fontsize=16)
        
        plt.tight_layout()
        plt.show()
    except (ValueError, IndexError):
        print("Invalid column number. Please try again.")

def main_menu():
    df = None
    while True:
        print("\nSEO Data Scraper Menu:")
        print("1. Load data from CSV")
        print("2. Load data from JSON")
        print("3. Scrape and save data")
        print("4. View sorted data")
        print("5. Visualize data")
        print("6. Exit")
        choice = input("Enter your choice (1-6): ")

        if choice == '1':
            df = load_from_csv(CSV_FILE)
        elif choice == '2':
            df = load_from_json(LIVE_SITE_FILE)
            print("Data loaded from JSON.")
        elif choice == '3':
            if df is None:
                print("Please load data first (option 1 or 2).")
                continue
            url_list = get_site_list(df)
            scrape_and_save(url_list)
        elif choice == '4':
            if df is None:
                print("Please load data first (option 1 or 2).")
                continue
            view_sorted_data(df)
        elif choice == '5':
            if df is None:
                print("Please load data first (option 1 or 2).")
                continue
            visualize_data(df)
        elif choice == '6':
            print("Exiting program.")
            break
        else:
            print("Invalid choice. Please try again.")

if __name__ == "__main__":
    main_menu()