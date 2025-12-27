import httpx
import logging
from typing import Optional, Dict, Any, List
from .. import config

logger = logging.getLogger(__name__)

class AzuraCastClient:
    def __init__(self):
        self.base_url = config.settings.azuracast_url.rstrip("/") if config.settings.azuracast_url else ""
        self.api_key = config.settings.azuracast_api_key
        self.station_id = config.settings.azuracast_station_id
        self.timeout = 10.0
        self._files_cache = {}
        self._cache_timestamp = None
        self._cache_ttl = 300
        self._schedules_cache = None
        self._schedules_cache_timestamp = None
        self._schedules_cache_ttl = 3600  # 1 godzina

    def _get_headers(self) -> Dict[str, str]:
        headers = {"Accept": "application/json"}
        if self.api_key:
            headers["X-API-Key"] = self.api_key
        return headers

    async def get_now_playing(self) -> Optional[Dict[str, Any]]:
        """Pobiera aktualnie grający utwór z AzuraCast"""
        if not self.base_url:
            logger.warning("AzuraCast URL not configured")
            return None
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                url = f"{self.base_url}/api/nowplaying/{self.station_id}"
                logger.debug(f"Fetching now playing from: {url}")
                response = await client.get(url, headers=self._get_headers())
                response.raise_for_status()
                data = response.json()
                
                if isinstance(data, list) and len(data) > 0:
                    station = data[0]
                else:
                    station = data
                
                now_playing = station.get("now_playing", {})
                song = now_playing.get("song", {})
                
                # Pobieranie stream URL z różnych możliwych miejsc
                stream_url = None
                
                # Sprawdź mounts (najczęściej tam jest stream URL)
                mount_points = station.get("mounts", [])
                if mount_points and len(mount_points) > 0:
                    mount = mount_points[0]
                    stream_url = mount.get("url")
                    # Jeśli nie ma URL, spróbuj zbudować z path
                    if not stream_url and mount.get("path"):
                        stream_url = f"{self.base_url}{mount.get('path')}"
                
                # Jeśli nie ma, sprawdź listeners.url
                if not stream_url:
                    listeners = station.get("listeners", {})
                    if isinstance(listeners, dict):
                        stream_url = listeners.get("url")
                
                # Jeśli nadal nie ma, sprawdź public_player_url
                if not stream_url:
                    stream_url = station.get("public_player_url")
                
                # Jeśli nadal nie ma, sprawdź konfigurację bezpośredniego stream URL
                if not stream_url:
                    stream_url = config.settings.azuracast_stream_url
                
                # Ostatnia opcja - użyj proxy endpoint z naszego backendu
                if not stream_url:
                    stream_url = f"{config.settings.app_base_url}/api/radio/stream"
                
                return {
                    "title": song.get("title", "Unknown"),
                    "artist": song.get("artist", "Unknown"),
                    "thumbnail": song.get("art", None),
                    "songId": str(song.get("id", now_playing.get("sh_id", ""))),
                    "streamUrl": stream_url
                }
        except httpx.HTTPStatusError as e:
            logger.error(f"AzuraCast API HTTP error (now-playing): {e.response.status_code} - {e.response.text}")
            return None
        except Exception as e:
            logger.error(f"AzuraCast API error (now-playing): {e}", exc_info=True)
            return None

    async def get_station_info(self) -> Optional[Dict[str, Any]]:
        """Pobiera informacje o stacji z AzuraCast"""
        if not self.base_url:
            logger.warning("AzuraCast URL not configured")
            return None
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                url = f"{self.base_url}/api/nowplaying/{self.station_id}"
                logger.debug(f"Fetching station info from: {url}")
                response = await client.get(url, headers=self._get_headers())
                response.raise_for_status()
                data = response.json()
                
                if isinstance(data, list) and len(data) > 0:
                    station = data[0]
                else:
                    station = data
                
                listeners = station.get("listeners", {})
                song_history = station.get("song_history", [])
                
                # Liczba utworów w bazie - spróbuj z różnych miejsc
                songs_count = 0
                if "media" in station:
                    media = station["media"]
                    if isinstance(media, dict):
                        songs_count = media.get("unique", 0)
                    elif isinstance(media, int):
                        songs_count = media
                
                # Jeśli nie znaleziono, użyj długości historii jako przybliżenia
                if songs_count == 0:
                    songs_count = len(song_history) if isinstance(song_history, list) else 0
                
                return {
                    "listeners_online": listeners.get("total", 0) or listeners.get("current", 0),
                    "songs_in_database": songs_count,
                    "songs_played_today": len(song_history) if isinstance(song_history, list) else 0
                }
        except httpx.HTTPStatusError as e:
            logger.error(f"AzuraCast API HTTP error (station-info): {e.response.status_code} - {e.response.text}")
            return None
        except Exception as e:
            logger.error(f"AzuraCast API error (station-info): {e}", exc_info=True)
            return None

    async def _refresh_files_cache(self):
        """Odświeża cache plików z AzuraCast"""
        import time
        current_time = time.time()
        
        if self._cache_timestamp and (current_time - self._cache_timestamp) < self._cache_ttl:
            return
        
        if not self.base_url:
            return
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                url = f"{self.base_url}/api/station/{self.station_id}/files"
                logger.debug(f"Refreshing files cache from: {url}")
                response = await client.get(url, headers=self._get_headers())
                response.raise_for_status()
                files = response.json()
                
                if not isinstance(files, list):
                    logger.warning(f"Files endpoint returned non-list: {type(files)}")
                    return
                
                self._files_cache = {}
                for file_item in files:
                    if not isinstance(file_item, dict):
                        continue
                    
                    file_song_id = str(file_item.get("song_id", ""))
                    if not file_song_id:
                        continue
                    
                    title = file_item.get("title", "")
                    artist = file_item.get("artist", "")
                    
                    if not title and not artist:
                        text = file_item.get("text", "")
                        if text and " - " in text:
                            parts = text.split(" - ", 1)
                            artist = parts[0].strip()
                            title = parts[1].strip()
                        elif text:
                            title = text
                    
                    art_url = file_item.get("art")
                    if art_url:
                        thumbnail = art_url
                    elif file_item.get("links", {}).get("art"):
                        thumbnail = file_item.get("links", {}).get("art")
                    else:
                        thumbnail = None
                    
                    self._files_cache[file_song_id] = {
                        "title": title or "Unknown",
                        "artist": artist or "Unknown",
                        "album": file_item.get("album", None),
                        "thumbnail": thumbnail
                    }
                
                self._cache_timestamp = current_time
                logger.info(f"Files cache refreshed: {len(self._files_cache)} songs cached")
        except httpx.HTTPStatusError as e:
            logger.error(f"AzuraCast API HTTP error (refresh-cache): {e.response.status_code} - {e.response.text}")
        except Exception as e:
            logger.error(f"AzuraCast API error (refresh-cache): {e}", exc_info=True)

    async def get_song_info(self, song_id: str) -> Optional[Dict[str, Any]]:
        """Pobiera informacje o utworze po ID z cache"""
        await self._refresh_files_cache()
        return self._files_cache.get(str(song_id))
    
    async def get_songs_info_batch(self, song_ids: List[str]) -> Dict[str, Dict[str, Any]]:
        """Pobiera informacje o wielu utworach jednocześnie"""
        await self._refresh_files_cache()
        result = {}
        for song_id in song_ids:
            info = self._files_cache.get(str(song_id))
            if info:
                result[str(song_id)] = info
        return result

    async def get_recent_songs(self, limit: int = 10) -> Optional[List[Dict[str, Any]]]:
        """Pobiera historię ostatnio odtwarzanych utworów"""
        if not self.base_url:
            logger.warning("AzuraCast URL not configured")
            return None
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                url = f"{self.base_url}/api/nowplaying/{self.station_id}"
                logger.debug(f"Fetching recent songs from: {url}")
                response = await client.get(url, headers=self._get_headers())
                response.raise_for_status()
                data = response.json()
                
                if isinstance(data, list) and len(data) > 0:
                    station = data[0]
                else:
                    station = data
                
                logger.debug(f"Station data keys: {station.keys() if isinstance(station, dict) else 'not a dict'}")
                
                # AzuraCast używa klucza "song_history" zamiast "recent_songs"
                recent_songs = station.get("song_history", [])
                if not recent_songs:
                    recent_songs = station.get("recent_songs", [])
                if not recent_songs:
                    recent_songs = station.get("history", [])
                
                logger.debug(f"Recent songs found: {len(recent_songs) if isinstance(recent_songs, list) else 0}")
                
                if not isinstance(recent_songs, list):
                    logger.warning(f"Recent songs is not a list: {type(recent_songs)}")
                    return []
                
                songs = []
                for history_item in recent_songs[:limit]:
                    if not isinstance(history_item, dict):
                        continue
                    
                    # AzuraCast zwraca strukturę z "song" wewnątrz history_item
                    song_data = history_item.get("song", {})
                    if not song_data:
                        continue
                    
                    # Pobierz tytuł i artystę
                    title = song_data.get("title", "")
                    artist = song_data.get("artist", "")
                    
                    # Jeśli brak title/artist, spróbuj z "text"
                    if not title and not artist:
                        text = song_data.get("text", "")
                        if text and " - " in text:
                            parts = text.split(" - ", 1)
                            artist = parts[0].strip()
                            title = parts[1].strip()
                        elif text:
                            title = text
                    
                    songs.append({
                        "title": title or "Unknown",
                        "artist": artist or "Unknown",
                        "thumbnail": song_data.get("art") or None,
                        "played_at": history_item.get("played_at")
                    })
                
                return songs
        except httpx.HTTPStatusError as e:
            logger.error(f"AzuraCast API HTTP error (recent-songs): {e.response.status_code} - {e.response.text}")
            return None
        except Exception as e:
            logger.error(f"AzuraCast API error (recent-songs): {e}", exc_info=True)
            return None

    async def get_next_song(self) -> Optional[Dict[str, Any]]:
        """Pobiera następny utwór w kolejce"""
        if not self.base_url:
            logger.warning("AzuraCast URL not configured")
            return None
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                url = f"{self.base_url}/api/nowplaying/{self.station_id}"
                logger.debug(f"Fetching next song from: {url}")
                response = await client.get(url, headers=self._get_headers())
                response.raise_for_status()
                data = response.json()
                
                if isinstance(data, list) and len(data) > 0:
                    station = data[0]
                else:
                    station = data
                
                playing_next = station.get("playing_next", {})
                if not playing_next or not isinstance(playing_next, dict):
                    return None
                
                song = playing_next.get("song", {})
                if not song or not isinstance(song, dict):
                    return None
                
                # Pobierz tytuł i artystę
                title = song.get("title", "")
                artist = song.get("artist", "")
                
                # Jeśli brak, spróbuj z "text"
                if not title and not artist:
                    text = song.get("text", "")
                    if text and " - " in text:
                        parts = text.split(" - ", 1)
                        artist = parts[0].strip()
                        title = parts[1].strip()
                    elif text:
                        title = text
                
                return {
                    "title": title or "Unknown",
                    "artist": artist or "Unknown",
                    "thumbnail": song.get("art") or None
                }
        except httpx.HTTPStatusError as e:
            logger.error(f"AzuraCast API HTTP error (next-song): {e.response.status_code} - {e.response.text}")
            return None
        except Exception as e:
            logger.error(f"AzuraCast API error (next-song): {e}", exc_info=True)
            return None

    async def get_schedules(self) -> Optional[List[Dict[str, Any]]]:
        """Pobiera zaplanowane audycje z endpointu /station/{station_id}/schedule dla całego tygodnia"""
        if not self.base_url:
            logger.warning("AzuraCast URL not configured")
            return None
        
        # Sprawdź cache
        import time
        current_time = time.time()
        if (self._schedules_cache is not None and 
            self._schedules_cache_timestamp is not None and
            (current_time - self._schedules_cache_timestamp) < self._schedules_cache_ttl):
            logger.debug("Returning cached schedules")
            return self._schedules_cache
        
        try:
            from datetime import datetime, timedelta, timezone
            from collections import defaultdict
            
            # Oblicz poniedziałek obecnego tygodnia
            now = datetime.now(timezone.utc)
            days_since_monday = now.weekday()
            monday = (now - timedelta(days=days_since_monday)).replace(hour=0, minute=0, second=0, microsecond=0)
            
            # Pobierz każdy dzień osobno
            all_schedule_items = []
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                for day_offset in range(7):
                    # Dla każdego dnia użyj daty poprzedniego dnia 23:59
                    target_day = monday + timedelta(days=day_offset)
                    previous_day = target_day - timedelta(days=1)
                    query_time = previous_day.replace(hour=23, minute=59, second=0, microsecond=0)
                    query_time_iso = query_time.isoformat().replace('+00:00', 'Z')
                    
                    url = f"{self.base_url}/api/station/{self.station_id}/schedule?now={query_time_iso}&rows=100"
                    logger.debug(f"Fetching schedule for day {day_offset} from: {url}")
                    
                    try:
                        response = await client.get(url, headers=self._get_headers())
                        response.raise_for_status()
                        day_data = response.json()
                        
                        if isinstance(day_data, list):
                            all_schedule_items.extend(day_data)
                    except Exception as e:
                        logger.warning(f"Error fetching schedule for day {day_offset}: {e}")
                        continue
            
            if not all_schedule_items:
                logger.warning("No schedule items retrieved")
                return None
            
            logger.info(f"Retrieved {len(all_schedule_items)} total schedule items")
            
            # Grupuj wystąpienia po nazwie i czasie
            schedule_groups = defaultdict(lambda: {
                "name": "",
                "start_time": "",
                "end_time": "",
                "days": set(),
                "ids": [],
                "occurrences": []
            })
            
            for item in all_schedule_items:
                if not isinstance(item, dict):
                    continue
                
                name = item.get("name") or item.get("title", "Auto DJ")
                start_iso = item.get("start")
                end_iso = item.get("end")
                
                if not start_iso or not end_iso:
                    continue
                
                try:
                    # Parsuj ISO daty
                    start_dt = datetime.fromisoformat(start_iso.replace('Z', '+00:00'))
                    end_dt = datetime.fromisoformat(end_iso.replace('Z', '+00:00'))
                    
                    # Wyciągnij godzinę i minutę
                    start_time = f"{start_dt.hour:02d}:{start_dt.minute:02d}"
                    end_time = f"{end_dt.hour:02d}:{end_dt.minute:02d}"
                    
                    # Wyciągnij dzień tygodnia (0=poniedziałek w Pythonie, ale AzuraCast używa 0=niedziela)
                    day_of_week = start_dt.weekday()
                    # Konwertuj na format AzuraCast (0=niedziela, 1=poniedziałek, ...)
                    azuracast_day = (day_of_week + 1) % 7
                    
                    # Grupuj po nazwie i czasie
                    key = f"{name}|{start_time}|{end_time}"
                    group = schedule_groups[key]
                    group["name"] = name
                    group["start_time"] = start_time
                    group["end_time"] = end_time
                    group["days"].add(azuracast_day)
                    group["ids"].append(item.get("id"))
                    group["occurrences"].append({
                        "date": start_dt.date(),
                        "day": azuracast_day
                    })
                    
                except Exception as e:
                    logger.warning(f"Error parsing schedule item {item.get('id')}: {e}")
                    continue
            
            # Konwertuj grupy na listę i wykryj audycje codzienne
            schedules = []
            for key, group in schedule_groups.items():
                # Sprawdź czy audycja występuje codziennie
                # Jeśli występuje we wszystkich 7 dniach tygodnia, uznaj za codzienną
                unique_days = list(group["days"])
                is_daily = len(unique_days) >= 7
                
                # Jeśli jest codzienna, ustaw days na pustą listę (oznacza wszystkie dni)
                # W przeciwnym razie użyj konkretnych dni
                days = [] if is_daily else sorted(unique_days)
                
                schedules.append({
                    "id": group["ids"][0] if group["ids"] else None,
                    "name": group["name"],
                    "start_time": group["start_time"],
                    "end_time": group["end_time"],
                    "days": days,
                    "is_enabled": group.get("is_enabled", True)
                })
            
            # Zapisz w cache
            self._schedules_cache = schedules
            self._schedules_cache_timestamp = current_time
            
            return schedules if schedules else None
        except httpx.HTTPStatusError as e:
            logger.error(f"AzuraCast API HTTP error (schedules): {e.response.status_code} - {e.response.text}")
            return None
        except Exception as e:
            logger.error(f"AzuraCast API error (schedules): {e}", exc_info=True)
            return None

azuracast_client = AzuraCastClient()

