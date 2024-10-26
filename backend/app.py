from flask import Flask, request, jsonify
from flask_cors import CORS
from models import db, User, Model, CSV
import firebase_admin
from firebase_admin import credentials, auth
import csv
import io
import json
from scraper import Scraper
import time
from urllib.parse import urljoin
import requests
import anthropic
from anthropic import AuthenticationError, APITimeoutError, AnthropicError
import logging
import re
from flask import Flask, request, jsonify
import requests
from bs4 import BeautifulSoup
import random


# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

CLAUDE_API_URL = "https://api.anthropic.com/v1/messages"

app = Flask(__name__)
# Adjust the origins as needed for security
CORS(app, resources={r"/api/*": {"origins": "*"}})


app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///your_database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

# Initialize Firebase Admin SDK
cred = credentials.Certificate("adminsdk.json")
firebase_admin.initialize_app(cred)


def get_current_user():
    token = request.headers.get('Authorization')
    if not token:
        return None
    try:
        decoded_token = auth.verify_id_token(token.split('Bearer ')[1])
        user_id = decoded_token['uid']
        user = User.query.get(user_id)
        if not user:
            user = User(id=user_id, email=decoded_token.get('email'))
            db.session.add(user)
            db.session.commit()
        return user
    except:
        return None


@app.route('/api/health')
def health_check():
    return jsonify({"status": "healthy"}), 200


@app.route('/api/csvs', methods=['GET', 'POST'])
def handle_csvs():
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    if request.method == 'GET':
        csvs = CSV.query.filter_by(user_id=user.id).all()
        return jsonify([{"id": csv.id, "filename": csv.filename, "uploaded_at": csv.uploaded_at} for csv in csvs])

    if request.method == 'POST':
        if 'file' not in request.files:
            return jsonify({"error": "No file part"}), 400
        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No selected file"}), 400
        if file and file.filename.endswith('.csv'):
            content = file.read().decode('utf-8')
            new_csv = CSV(filename=file.filename,
                          content=content, user_id=user.id)
            db.session.add(new_csv)
            db.session.commit()
            return jsonify({"message": "CSV uploaded successfully", "id": new_csv.id}), 201
        return jsonify({"error": "Invalid file type"}), 400


@app.route('/api/models', methods=['GET', 'POST'])
def handle_models():
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    if request.method == 'GET':
        models = Model.query.filter_by(user_id=user.id).all()
        return jsonify([{"id": model.id, "name": model.name, "created_at": model.created_at} for model in models])

    if request.method == 'POST':
        data = request.json
        
        # Handle URL-based model creation
        if 'url' in data:
            url = data.get('url')
            model_name = data.get('model_name')
            
            if not all([url, model_name]):
                return jsonify({"error": "Missing required fields"}), 400
            
            # Create a single-URL model with the same structure as CSV-based models
            processed_data = [{
                "url": url,
                "additional_data": {}  # Empty additional_data to match CSV structure
            }]
            
            new_model = Model(
                name=model_name,
                base_url="",  # Empty base_url as per requirement
                url_column="url",  # Use "url" as the default column name
                user_id=user.id,
                data=json.dumps(processed_data)
            )
            
            db.session.add(new_model)
            db.session.commit()
            
            return jsonify({"message": "Model created successfully", "id": new_model.id}), 201
        
        # Handle CSV-based model creation (existing logic)
        csv_id = data.get('csv_id')
        url_column = data.get('url_column')
        base_url = data.get('base_url', '')
        model_name = data.get('model_name')

        if not all([csv_id, url_column, model_name]):
            return jsonify({"error": "Missing required fields"}), 400

        csv_file = CSV.query.get(csv_id)
        if not csv_file or csv_file.user_id != user.id:
            return jsonify({"error": "CSV not found or unauthorized"}), 404

        csv_content = csv.DictReader(io.StringIO(csv_file.content))
        processed_data = []
        for row in csv_content:
            url = row[url_column]
            if base_url:
                url = base_url + url
            processed_data.append({"url": url, "additional_data": {
                                  k: v for k, v in row.items() if k != url_column}})

        new_model = Model(name=model_name, base_url=base_url, url_column=url_column,
                          user_id=user.id, data=json.dumps(processed_data))
        db.session.add(new_model)
        db.session.commit()

        return jsonify({"message": "Model created successfully", "id": new_model.id}), 201

@app.route('/api/models/<int:model_id>', methods=['GET', 'DELETE'])
def handle_model(model_id):
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    model = Model.query.get(model_id)
    if not model or model.user_id != user.id:
        return jsonify({"error": "Model not found or unauthorized"}), 404

    if request.method == 'GET':
        return jsonify({
            "id": model.id,
            "name": model.name,
            "base_url": model.base_url,
            "url_column": model.url_column,
            "created_at": model.created_at,
            "data": json.loads(model.data)
        })

    if request.method == 'DELETE':
        db.session.delete(model)
        db.session.commit()
        return jsonify({"message": "Model deleted successfully"}), 200


@app.route('/api/models/<int:model_id>/scrape', methods=['POST'])
def scrape_model(model_id):
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    model = Model.query.get(model_id)
    if not model or model.user_id != user.id:
        return jsonify({"error": "Model not found or unauthorized"}), 404

    data = request.json
    rescrape = data.get('rescrape', False)
    limit = data.get('limit', 100)
    delay = data.get('delay', 0.1)

    scraper = Scraper()
    model_data = json.loads(model.data)
    messages = []
    last_scraped_id = 0

    for i, item in enumerate(model_data):
        if i >= limit:
            break

        if not rescrape and 'scraped_at' in item:
            continue

        url = item['url']
        scraped_data = scraper.scrape_url(url, model.base_url)

        if 'error' in scraped_data:
            error_message = f"Failed to scrape {url}: {scraped_data['error']}"
            app.logger.error(error_message)
            messages.append(error_message)
        else:
            item.update(scraped_data)
            messages.append(f"Successfully scraped: {url}")

        last_scraped_id = i
        time.sleep(delay)

    model.data = json.dumps(model_data)
    model.last_scraped_id = last_scraped_id
    db.session.commit()

    return jsonify({
        "message": "Scraping completed",
        "messages": messages,
        "last_scraped_id": last_scraped_id
    }), 200


@app.route('/api/models/<int:model_id>/generate-alt-content', methods=['POST'])
def generate_alt_content(model_id):
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    model = db.session.get(Model, model_id)  # Updated to use session.get()
    if not model or model.user_id != user.id:
        return jsonify({"error": "Model not found or unauthorized"}), 404

    data = request.json
    api_key = data.get('apiKey')
    prompt = data.get('prompt')
    claude_model = data.get(
        'model', "claude-3-sonnet-20240229")  # Updated model name
    logger.info(f"Received model name from frontend: {data.get('model')}")
    logger.info(f"Using Claude model: {claude_model}")
    delay = data.get('delay', 1)
    rate_limit = data.get('rateLimit', 10)
    max_tokens = data.get('maxTokens', 8000)

    if not api_key:
        return jsonify({"error": "API key is required"}), 400

    logger.info(f"Starting alt content generation for model {model_id}")
    logger.info(f"Using Claude model: {claude_model}")

    model_data = json.loads(model.data)
    messages = []
    processed_count = 0
    total_tokens_generated = 0

    client = anthropic.Anthropic(api_key=api_key)

    for item in model_data:
        if processed_count >= rate_limit:
            logger.info(
                f"Rate limit reached. Processed {processed_count} items.")
            break

        if 'text_content' not in item:
            message = f"Skipped item: No text content available for URL {item.get('url', 'Unknown URL')}"
            logger.warning(message)
            messages.append(message)
            continue

        try:
            logger.info(
                f"Generating alt content for URL: {item.get('url', 'Unknown URL')}")
            alt_content = generate_claude_response(
                client, prompt, item['text_content'], claude_model, max_tokens)

            version = 0
            while f'alt-content-{version}' in item:
                version += 1

            item[f'alt-content-{version}'] = alt_content['content']
            tokens_generated = alt_content['tokens_generated']
            total_tokens_generated += tokens_generated

            message = f"Generated alt-content-{version} for URL: {item.get('url', 'Unknown URL')}. Tokens: {tokens_generated}"
            logger.info(message)
            messages.append(message)
            processed_count += 1

            time.sleep(delay)
        except AnthropicError as e:
            error_message = f"Anthropic API error for URL {item.get('url', 'Unknown URL')}: {str(e)}"
            logger.error(error_message)
            messages.append(error_message)
            break  # Stop processing if we encounter an API error
        except Exception as e:
            error_message = f"Error generating alt content for URL {item.get('url', 'Unknown URL')}: {str(e)}"
            logger.error(error_message)
            messages.append(error_message)

    model.data = json.dumps(model_data)
    db.session.commit()

    logger.info(
        f"Alt content generation completed. Total tokens generated: {total_tokens_generated}")
    return jsonify({
        "message": "Alt content generation completed",
        "messages": messages,
        "total_tokens_generated": total_tokens_generated
    }), 200


def generate_claude_response(client, prompt, content, model, max_tokens):
    try:
        logger.info(f"Sending request to Claude API with model: {model}")
        message = client.messages.create(
            model=model,
            max_tokens=max_tokens,
            temperature=0,
            messages=[
                {"role": "user", "content": f"{prompt}\n\nContent: {content}"}
            ]
        )
        logger.info(
            f"Received response from Claude API. Tokens generated: {message.usage.output_tokens}")
        return {
            "content": message.content[0].text,
            "tokens_generated": message.usage.output_tokens
        }
    except anthropic.APIError as e:
        logger.error(f"Anthropic API Error: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error in Claude API call: {str(e)}")
        raise


@app.route('/api/models/<int:model_id>/rate-content', methods=['POST'])
def rate_content(model_id):
    logger.info(f"Received request to rate content for model {model_id}")
    user = get_current_user()
    if not user:
        logger.warning("Unauthorized access attempt")
        return jsonify({"error": "Unauthorized"}), 401

    model = Model.query.get(model_id)
    if not model or model.user_id != user.id:
        logger.warning(f"Model not found or unauthorized for user {user.id}")
        return jsonify({"error": "Model not found or unauthorized"}), 404

    data = request.json
    api_key = data.get('apiKey')
    content_type = data.get('contentType')
    rating_method = data.get('ratingMethod')

    if not all([api_key, content_type, rating_method]):
        logger.warning("Missing required fields in request")
        return jsonify({"error": "Missing required fields"}), 400

    logger.info(
        f"Rating content of type {content_type} using method {rating_method}")

    model_data = json.loads(model.data)
    messages = []
    total_rated = 0

    for item in model_data:
        content = item.get(content_type)
        if content is None:
            logger.warning(
                f"No {content_type} found for URL {item.get('url', 'Unknown URL')}")
            messages.append(
                f"Skipped rating for URL {item.get('url', 'Unknown URL')}: No {content_type} found")
            continue

        if not content.strip():
            logger.warning(
                f"Empty {content_type} found for URL {item.get('url', 'Unknown URL')}")
            messages.append(
                f"Skipped rating for URL {item.get('url', 'Unknown URL')}: Empty {content_type}")
            continue

        try:
            rating = generate_content_rating(api_key, content, rating_method)
            item[f'{content_type}-rating'] = rating
            total_rated += 1
            message = f"Rated {content_type} for URL {item.get('url', 'Unknown URL')}: {rating}/100"
            logger.info(message)
            messages.append(message)
        except Exception as e:
            error_message = f"Error rating {content_type} for URL {item.get('url', 'Unknown URL')}: {str(e)}"
            logger.error(error_message)
            messages.append(error_message)

    if total_rated > 0:
        model.data = json.dumps(model_data)
        db.session.commit()
        logger.info(
            f"Successfully rated {total_rated} items for model {model_id}")
    else:
        logger.warning(
            f"No content of type {content_type} found to rate in model {model_id}")

    return jsonify({"messages": messages, "total_rated": total_rated}), 200


def generate_content_rating(api_key, content, rating_method):
    if rating_method != 'claude':
        raise ValueError("Unsupported rating method")

    client = anthropic.Anthropic(api_key=api_key)

    system_prompt = (
        "Rate the following content out of 100 based on how much you would recommend it to a user. "
        "Consider factors such as clarity, informativeness, and engagement. "
        "Provide your reasoning, and then at the end of your response, include the total numerical rating between two hash symbols, like this: #90#"
    )

    logger.info("Sending request to Claude API for content rating")
    try:
        message = client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=300,
            temperature=0,
            system=system_prompt,
            messages=[
                {"role": "user", "content": content}
            ]
        )

        response_text = message.content[0].text.strip()
        logger.info(f"Received response from Claude API: {response_text}")

        # Extract rating from anywhere in the message
        match = re.search(r'#(\d+)#', response_text)
        if match:
            rating = int(match.group(1))
            logger.info(f"Extracted rating: {rating}")
            return rating
        else:
            logger.error("No rating found in the response")
            logger.error(f"Full response: {response_text}")
            raise ValueError("No rating found in the response")
    except Exception as e:
        logger.error(f"Error generating content rating: {str(e)}")
        raise


@app.route('/api/models/<int:model_id>/test', methods=['POST'])
def test_model(model_id):
    logger.info(f"Entered test_model function with model_id: {model_id}")
    logger.info(f"Request method: {request.method}")
    logger.info(f"Request headers: {request.headers}")
    logger.info(f"Request data: {request.get_data(as_text=True)}")

    user = get_current_user()
    if not user:
        logger.warning(f"Failed to authenticate user for model {model_id}")
        return jsonify({"error": "Failed to authenticate user"}), 401

    try:
        model = db.session.get(Model, model_id)
        if not model:
            logger.error(f"Model {model_id} not found")
            return jsonify({"error": f"Model {model_id} not found"}), 404

        if model.user_id != user.id:
            logger.warning(
                f"Unauthorized access attempt to model {model_id} by user {user.id}")
            return jsonify({"error": "Unauthorized access to this model"}), 403

        data = request.json
        query = data.get('query')
        test_method = data.get('testMethod')
        max_return = data.get('maxReturn', 5)
        max_highlight_search = data.get('maxHighlightSearch', 50)
        highlighted_url = data.get('highlightedUrl')

        logger.info(
            f"Test parameters: query='{query}', method='{test_method}', max_return={max_return}, max_highlight_search={max_highlight_search}, highlighted_url='{highlighted_url}'")

        if not query or not test_method:
            logger.warning("Missing required fields in request")
            return jsonify({"error": "Missing required fields"}), 400

        if test_method == 'google':
            results = google_search(
                query, max_return, max_highlight_search, highlighted_url)
        elif test_method == 'gpt':
            results = gpt_search(query, max_return)
        else:
            logger.warning(f"Unsupported test method: {test_method}")
            return jsonify({"error": "Unsupported test method"}), 400

        # Save query to model
        model_data = json.loads(model.data)
        if isinstance(model_data, list):
            model_data = {'data': model_data, 'queries': []}
        elif isinstance(model_data, dict) and 'queries' not in model_data:
            model_data['queries'] = []

        model_data['queries'].append({'query': query, 'results': results})
        model.data = json.dumps(model_data)
        db.session.commit()

        logger.info(f"Successfully processed test for model {model_id}")
        return jsonify(results), 200

    except Exception as e:
        logger.exception(
            f"An error occurred while processing test for model {model_id}: {str(e)}")
        return jsonify({"error": "An unexpected error occurred", "details": str(e)}), 500


def get_current_user():
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return None
    try:
        token = auth_header.split('Bearer ')[1]
        decoded_token = auth.verify_id_token(token)
        user_id = decoded_token['uid']
        user = User.query.get(user_id)
        if not user:
            user = User(id=user_id, email=decoded_token.get('email'))
            db.session.add(user)
            db.session.commit()
        return user
    except:
        return None


def google_search(query, max_return, max_highlight_search, highlighted_url):
    # Note: In a production environment, use a proper Google Search API or a more robust scraping method
    url = f"https://www.google.com/search?q={query}&num={max_highlight_search}"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"}

    response = requests.get(url, headers=headers)
    soup = BeautifulSoup(response.text, 'html.parser')

    results = []
    for idx, result in enumerate(soup.find_all('div', class_='yuRUbf')):
        if idx >= max_return and result.a['href'] != highlighted_url:
            break

        title = result.h3.text if result.h3 else "No title"
        url = result.a['href']
        results.append({"title": title, "url": url})

    if highlighted_url and highlighted_url not in [r['url'] for r in results]:
        highlighted_rank = next((idx for idx, r in enumerate(
            results, 1) if r['url'] == highlighted_url), None)
        if highlighted_rank:
            results.append({"title": "Highlighted URL",
                           "url": highlighted_url, "rank": highlighted_rank})
        else:
            results.append({"title": "Highlighted URL", "url": highlighted_url,
                           "rank": f"Not found in top {max_highlight_search}"})

    return results


def gpt_search(query, max_return):
    # Dummy function for GPT search
    dummy_results = [
        {"title": f"GPT Result {i}", "url": f"https://example.com/gpt-result-{i}"}
        for i in range(1, max_return + 1)
    ]
    return dummy_results


@app.route('/api/models/<int:model_id>/add-url', methods=['POST'])
def add_url_to_model(model_id):
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    model = Model.query.get(model_id)
    if not model or model.user_id != user.id:
        return jsonify({"error": "Model not found or unauthorized"}), 404

    data = request.json
    url = data.get('url')
    if not url:
        return jsonify({"error": "URL is required"}), 400

    try:
        model_data = json.loads(model.data)
        # Handle both list and dict formats
        if isinstance(model_data, dict):
            if 'data' not in model_data:
                model_data['data'] = []
            model_data['data'].append({
                "url": url,
                "additional_data": {}
            })
        else:
            model_data.append({
                "url": url,
                "additional_data": {}
            })
        
        model.data = json.dumps(model_data)
        db.session.commit()
        
        return jsonify({"message": "URL added successfully"}), 200
    except Exception as e:
        logger.error(f"Error in add_url_to_model: {str(e)}")
        return jsonify({"error": f"Failed to add URL: {str(e)}"}), 500


if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
