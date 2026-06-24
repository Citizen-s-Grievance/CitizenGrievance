FROM python:3.11-slim

WORKDIR /app

# Install system dependencies (needed for some ML/PDF libraries)
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY ai_module/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY ai_module/ .

CMD ["python", "run_worker.py"]
