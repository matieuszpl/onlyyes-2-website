import yt_dlp
import re
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)

def is_youtube_url(url: str) -> bool:
    patterns = [
        r'youtube\.com/watch\?v=',
        r'youtu\.be/',
        r'youtube\.com/playlist\?list=',
        r'youtube\.com/watch\?.*list=',
    ]
    return any(re.search(pattern, url, re.IGNORECASE) for pattern in patterns)

def is_spotify_url(url: str) -> bool:
    patterns = [
        r'spotify\.com/track/',
        r'spotify\.com/album/',
        r'spotify\.com/playlist/',
        r'open\.spotify\.com/track/',
        r'open\.spotify\.com/album/',
        r'open\.spotify\.com/playlist/',
    ]
    return any(re.search(pattern, url, re.IGNORECASE) for pattern in patterns)

def is_playlist_url(url: str) -> bool:
    return 'playlist' in url.lower() or 'list=' in url.lower()

def extract_youtube_id(url: str) -> Optional[str]:
    patterns = [
        r'youtube\.com/watch\?v=([^&]+)',
        r'youtu\.be/([^?]+)',
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None

def get_video_info(url: str) -> Optional[Dict]:
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'extract_flat': False,
        'skip_download': True,
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            
            if not info:
                return None
            
            if 'entries' in info:
                return None
            
            title = info.get('title', 'Unknown')
            artist = info.get('uploader', 'Unknown')
            duration = info.get('duration', 0)
            thumbnail = info.get('thumbnail') or info.get('thumbnails', [{}])[0].get('url') if info.get('thumbnails') else None
            video_id = info.get('id')
            
            if 'artist' in info.get('artist', ''):
                artist = info.get('artist')
            elif 'channel' in info:
                artist = info.get('channel', artist)
            
            return {
                'title': title,
                'artist': artist,
                'duration_seconds': duration,
                'thumbnail': thumbnail,
                'youtube_id': video_id,
                'source_type': 'YOUTUBE',
                'url': url
            }
    except Exception as e:
        logger.error(f"Error extracting video info: {e}")
        return None

def get_playlist_info(url: str, max_items: int = 50) -> Optional[List[Dict]]:
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'extract_flat': 'in_playlist',
        'skip_download': True,
        'playlistend': max_items,
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            
            if not info or 'entries' not in info:
                return None
            
            entries = info.get('entries', [])
            if not entries:
                return None
            
            results = []
            for entry in entries:
                if not entry:
                    continue
                
                entry_id = entry.get('id')
                if not entry_id:
                    continue
                
                entry_url = f"https://www.youtube.com/watch?v={entry_id}"
                title = entry.get('title', 'Unknown')
                artist = entry.get('channel', entry.get('uploader', 'Unknown'))
                duration = entry.get('duration') or entry.get('duration_string', 0)
                
                if isinstance(duration, str):
                    try:
                        parts = duration.split(':')
                        if len(parts) == 2:
                            duration = int(parts[0]) * 60 + int(parts[1])
                        elif len(parts) == 3:
                            duration = int(parts[0]) * 3600 + int(parts[1]) * 60 + int(parts[2])
                        else:
                            duration = 0
                    except:
                        duration = 0
                
                thumbnail = entry.get('thumbnail') or f"https://img.youtube.com/vi/{entry_id}/default.jpg"
                
                results.append({
                    'title': title,
                    'artist': artist,
                    'duration_seconds': duration or 0,
                    'thumbnail': thumbnail,
                    'youtube_id': entry_id,
                    'source_type': 'YOUTUBE',
                    'url': entry_url
                })
            
            return results if results else None
    except Exception as e:
        logger.error(f"Error extracting playlist info: {e}")
        return None

def search_youtube(query: str, max_results: int = 1) -> Optional[Dict]:
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'extract_flat': False,
        'skip_download': True,
        'default_search': 'ytsearch',
    }
    
    try:
        search_query = f"ytsearch{max_results}:{query}"
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(search_query, download=False)
            
            if not info or 'entries' not in info:
                return None
            
            entry = info['entries'][0] if info['entries'] else None
            if not entry:
                return None
            
            title = entry.get('title', 'Unknown')
            artist = entry.get('uploader', entry.get('channel', 'Unknown'))
            duration = entry.get('duration', 0)
            thumbnail = entry.get('thumbnail') or entry.get('thumbnails', [{}])[0].get('url') if entry.get('thumbnails') else None
            video_id = entry.get('id')
            url = entry.get('webpage_url') or f"https://www.youtube.com/watch?v={video_id}"
            
            return {
                'title': title,
                'artist': artist,
                'duration_seconds': duration or 0,
                'thumbnail': thumbnail,
                'youtube_id': video_id,
                'source_type': 'YOUTUBE',
                'url': url
            }
    except Exception as e:
        logger.error(f"Error searching YouTube: {e}")
        return None

def preview_content(input_str: str) -> Dict:
    input_str = input_str.strip()
    
    if is_youtube_url(input_str):
        if is_playlist_url(input_str):
            playlist_items = get_playlist_info(input_str)
            if playlist_items:
                return {
                    'type': 'playlist',
                    'items': playlist_items,
                    'count': len(playlist_items)
                }
            else:
                return {
                    'type': 'error',
                    'message': 'Nie udało się pobrać playlisty'
                }
        else:
            video_info = get_video_info(input_str)
            if video_info:
                return {
                    'type': 'single',
                    'item': video_info
                }
            else:
                return {
                    'type': 'error',
                    'message': 'Nie udało się pobrać informacji o utworze'
                }
    elif is_spotify_url(input_str):
        search_result = search_youtube(input_str)
        if search_result:
            return {
                'type': 'single',
                'item': search_result
            }
        else:
            return {
                'type': 'error',
                'message': 'Nie znaleziono utworu na YouTube'
            }
    else:
        search_result = search_youtube(input_str)
        if search_result:
            return {
                'type': 'single',
                'item': search_result
            }
        else:
            return {
                'type': 'error',
                'message': 'Nie znaleziono utworu'
            }

