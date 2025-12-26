#!/usr/bin/env python3
import asyncio
import sys
import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import select, update

# Dodaj ścieżkę do backend (działa zarówno lokalnie jak i w kontenerze)
script_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(script_dir)
sys.path.insert(0, backend_dir)

from src import models

async def promote_admin(discord_id: str):
    database_url = os.getenv("DATABASE_URL", "postgresql://user:password@db:5432/db_name")
    database_url_async = database_url.replace("postgresql://", "postgresql+asyncpg://")
    
    engine = create_async_engine(database_url_async, echo=False)
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        result = await session.execute(
            select(models.User).where(models.User.discord_id == discord_id)
        )
        user = result.scalar_one_or_none()
        
        if not user:
            print(f"❌ Użytkownik z discord_id={discord_id} nie istnieje w bazie")
            return False
        
        if user.is_admin:
            print(f"✅ Użytkownik {user.username} ({discord_id}) już jest administratorem")
            return True
        
        await session.execute(
            update(models.User)
            .where(models.User.discord_id == discord_id)
            .values(is_admin=True)
        )
        await session.commit()
        
        print(f"✅ Użytkownik {user.username} ({discord_id}) został awansowany na administratora")
        return True

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Użycie: python promote_admin.py <discord_id>")
        print("Przykład: python promote_admin.py 123456789012345678")
        sys.exit(1)
    
    discord_id = sys.argv[1]
    asyncio.run(promote_admin(discord_id))

