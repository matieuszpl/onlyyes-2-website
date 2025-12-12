from authlib.integrations.starlette_client import OAuth
from fastapi import Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
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

async def get_current_user(request: Request, db: AsyncSession):
    user_info = request.session.get('user')
    if not user_info:
        return None
    
    result = await db.execute(select(models.User).where(models.User.discord_id == user_info['id']))
    return result.scalar_one_or_none()