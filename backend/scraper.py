import requests
from bs4 import BeautifulSoup
from typing import Dict, Any, List
from datetime import datetime
import logging
import traceback
from urllib.parse import urlparse, urljoin


class Scraper:
    def __init__(self):
        self.logger = logging.getLogger(__name__)

    def scrape_url(self, url: str, base_url: str = '') -> Dict[str, Any]:
        self.logger.info(f"Attempting to scrape URL: {url}")

        url_variations = self.generate_url_variations(url, base_url)

        for variation in url_variations:
            try:
                self.logger.info(f"Trying URL variation: {variation}")
                return self._perform_scrape(variation)
            except requests.RequestException as e:
                self.logger.warning(f"Failed to scrape {variation}: {str(e)}")

        error_msg = f"Failed to scrape {url} after trying multiple variations"
        self.logger.error(error_msg)
        return {"error": error_msg}

    def generate_url_variations(self, url: str, base_url: str) -> List[str]:
        variations = [
            url,  # Original URL
            urljoin(base_url, url),  # Combine with base_url
            f"https://{url}",  # Add https://
            f"http://{url}",  # Add http://
            f"https:{url}",  # Add https:
            f"http:{url}",  # Add http:
            f"https:/{url}",  # Add https:/
            f"http:/{url}",  # Add http:/
            f"https://{url}",  # Add https://
            f"http://{url}",  # Add http://
        ]

        # Remove duplicates while preserving order
        return list(dict.fromkeys(variations))

    def _perform_scrape(self, url: str) -> Dict[str, Any]:
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, 'html.parser')

            title = soup.title.string if soup.title else 'Not found'
            h1 = soup.find('h1').text if soup.find('h1') else 'Not found'
            description = soup.find('meta', {'name': 'description'})
            description = description['content'] if description else 'Not found'

            main_content = soup.find('main') or soup.find(
                'div', class_=['content', 'main', 'article'])
            if main_content:
                for elem in main_content.select('nav, header, footer, .navigation, .menu, .sidebar'):
                    elem.decompose()
                content_elements = main_content.find_all(
                    ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'])
            else:
                content_elements = soup.find_all(
                    ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'])

            text_content = '\n\n'.join(
                [elem.get_text(strip=True) for elem in content_elements])

            return {
                "url": url,
                "title": title,
                "h1": h1,
                "meta_description": description,
                "text_content": text_content,
                "scraped_at": datetime.now().isoformat()
            }
        except requests.Timeout:
            raise requests.RequestException(
                f"Request timed out for URL: {url}")
        except requests.HTTPError as e:
            raise requests.RequestException(
                f"HTTP error occurred: {e.response.status_code} {e.response.reason}")
        except requests.RequestException as e:
            raise requests.RequestException(
                f"An error occurred while requesting the URL: {str(e)}")
