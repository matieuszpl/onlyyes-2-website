import os
from celery import Celery
from celery.schedules import crontab

# Pobranie adresu Redisa ze zmiennych środowiskowych (zdefiniowanych w docker-compose)
CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", "redis://redis:6379/0")

# Inicjalizacja aplikacji Celery
celery_app = Celery(
    "radio_worker",
    broker=CELERY_BROKER_URL,
    backend=CELERY_BROKER_URL
)

# Konfiguracja strefy czasowej (ważne dla harmonogramu audycji!)
celery_app.conf.timezone = 'Europe/Warsaw'

# --- HARMONOGRAM ZADAŃ (CELERY BEAT) ---
celery_app.conf.beat_schedule = {
    # Przykład: Zadanie testowe, uruchamiane co minutę, żebyś widział w logach, że działa
    'health-check-every-minute': {
        'task': 'src.tasks.health_check_task',
        'schedule': 60.0, # co 60 sekund
    },
    # Tu później dodamy:
    # 'generate-news-at-12': { ... schedule: crontab(hour=11, minute=50) ... }
}

# --- DEFINICJE ZADAŃ (TASKS) ---

@celery_app.task(name="src.tasks.health_check_task")
def health_check_task():
    """Proste zadanie do sprawdzenia czy worker żyje."""
    print(" [x] Worker heartbeat: System operacyjny AI jest gotowy do pracy.")
    return "OK"

@celery_app.task(name="src.tasks.process_suggestion")
def process_suggestion(url: str):
    """Zadanie placeholder pod przyszłe pobieranie z YT"""
    print(f" [x] Otrzymano zadanie przetworzenia linku: {url}")
    # Tu w przyszłości będzie logika yt-dlp
    return {"status": "processed", "url": url}