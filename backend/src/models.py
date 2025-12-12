from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    discord_id = Column(String, unique=True, index=True) # ID z Discorda
    username = Column(String)
    avatar_url = Column(String, nullable=True)
    is_admin = Column(Boolean, default=False)
    reputation_score = Column(Integer, default=0) # Punkty za dobry gust
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Suggestion(Base):
    __tablename__ = "suggestions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id")) # Kto zgłosił
    
    raw_input = Column(String) # To co wkleił user
    source_type = Column(String) # YOUTUBE / SPOTIFY / TEXT
    
    # Metadane (uzupełnione przez Workera)
    title = Column(String, nullable=True)
    artist = Column(String, nullable=True)
    youtube_id = Column(String, nullable=True)
    thumbnail_url = Column(String, nullable=True)
    duration_seconds = Column(Integer, nullable=True)
    
    # Status: PENDING, APPROVED, REJECTED, PROCESSED (Wgrane do Azury)
    status = Column(String, default="PENDING") 
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Vote(Base):
    __tablename__ = "votes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    song_id = Column(String)
    vote_type = Column(String)  # LIKE, DISLIKE
    created_at = Column(DateTime(timezone=True), server_default=func.now())