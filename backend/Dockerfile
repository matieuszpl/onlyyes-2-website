FROM python:3.11-slim

# Instalacja FFmpeg i narzędzi systemowych (git potrzebny czasem do instalacji pakietów)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    git \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Instalacja zależności Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Tworzenie katalogu na pliki tymczasowe
RUN mkdir -p audio_temp src

# Domyślna komenda (nadpisywana przez docker-compose)
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]