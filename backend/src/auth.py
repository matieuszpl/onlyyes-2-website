from authlib.integrations.starlette_client import OAuth
from fastapi import Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from . import models, config

oauth = OAuth()

oauth.register(
    name='discord',
    client_id=config.settings.discord_client_id,
    client_secret=config.settings.discord_client_secret,
    access_token_url='https://discord.com/api/oauth2/token',
    access_token_params=None,
    authorize_url='https://discord.com/api/oauth2/authorize',
    authorize_params=None,
    api_base_url='https://discord.com/api/v10/',
    client_kwargs={'scope': 'identify email'}
)

oauth.register(
    name='google',
    client_id=config.settings.google_client_id,
    client_secret=config.settings.google_client_secret,
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    api_base_url='https://www.googleapis.com/oauth2/v1/',
    client_kwargs={'scope': 'openid email profile'}
)

async def get_current_user(request: Request, db: AsyncSession):
    try:
        if not hasattr(request, 'session') or not request.session:
            return None
        user_info = request.session.get('user')
        if not user_info or not isinstance(user_info, dict):
            return None
        
        auth_provider = user_info.get('provider', 'discord')
        user_id = user_info.get('id')
        
        if not user_id:
            return None
        
        if auth_provider == 'discord':
            result = await db.execute(select(models.User).where(models.User.discord_id == user_id))
        elif auth_provider == 'google':
            result = await db.execute(select(models.User).where(models.User.google_id == user_id))
        else:
            return None
        
        return result.scalar_one_or_none()
    except (AttributeError, KeyError, TypeError, Exception):
        return None