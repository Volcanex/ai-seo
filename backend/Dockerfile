FROM python:3.11-slim

WORKDIR /app

# Install system dependencies including MySQL dev packages and pkg-config
RUN apt-get update && apt-get install -y \
    build-essential \
    python3-dev \
    pkg-config \
    default-libmysqlclient-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy everything from current directory to /app
COPY . .

# Install Python dependencies and gunicorn
RUN pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir gunicorn

ENV PYTHONUNBUFFERED=1
ENV FLASK_APP=app.py
ENV FLASK_ENV=production

# Create non-root user and set permissions
RUN mkdir -p logs && \
    useradd -m appuser && \
    chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

EXPOSE 8000

# Use full path to gunicorn
CMD ["/usr/local/bin/gunicorn", "--bind", "0.0.0.0:8000", "--workers", "3", "--log-level", "debug", "app:app"]