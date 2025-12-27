from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    discord_id = Column(String, unique=True, index=True) # ID z Discorda
    username = Column(String)
    avatar_url = Column(String, nullable=True)
    is_admin = Column(Boolean, default=False)
    reputation_score = Column(Integer, default=0) # Punkty za dobry gust
    xp = Column(Integer, default=0) # Punkty doświadczenia
    featured_badge_id = Column(Integer, ForeignKey("badges.id"), nullable=True)
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
    xp_awarded = Column(Boolean, default=False)  # Czy XP zostało już przyznane za ten głos
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class ListeningSession(Base):
    __tablename__ = "listening_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    start_time = Column(DateTime(timezone=True), server_default=func.now())
    end_time = Column(DateTime(timezone=True), nullable=True)
    duration_seconds = Column(Integer, default=0)
    xp_awarded = Column(Integer, default=0)

class XpAward(Base):
    __tablename__ = "xp_awards"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    song_id = Column(String, nullable=True)  # NULL dla sesji słuchania
    xp_amount = Column(Integer, nullable=False)
    award_type = Column(String)  # VOTE, LISTENING
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Badge(Base):
    __tablename__ = "badges"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    icon = Column(String, nullable=True)  # Nazwa ikony lub emoji
    color = Column(String, nullable=True)  # Kolor w hex
    auto_award_type = Column(String, nullable=True)  # NIGHT_SHIFT, PLAYLIST_GUARDIAN, MANUAL
    auto_award_config = Column(Text, nullable=True)  # JSON config dla automatycznego nadawania
    xp_reward = Column(Integer, default=0)  # XP przyznawane za otrzymanie odznaki
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class UserBadge(Base):
    __tablename__ = "user_badges"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    badge_id = Column(Integer, ForeignKey("badges.id"), nullable=False)
    awarded_at = Column(DateTime(timezone=True), server_default=func.now())
    awarded_by = Column(Integer, ForeignKey("users.id"), nullable=True)  # NULL dla automatycznych

class IssueReport(Base):
    __tablename__ = "issue_reports"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # NULL dla gości
    issue_type = Column(String, nullable=False)  # BUG, FEATURE
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    status = Column(String, default="PENDING")  # PENDING, APPROVED, REJECTED
    ip_address = Column(String, nullable=True)  # Dla rate limiting gości
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    approved_at = Column(DateTime(timezone=True), nullable=True)