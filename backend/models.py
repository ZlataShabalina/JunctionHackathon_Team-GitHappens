from sqlalchemy import String, Integer, Float, DateTime, ForeignKey, Text, JSON, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from db import Base

def utcnow() -> datetime:
    return datetime.now(timezone.utc)

class Crew(Base):
    __tablename__ = "crew"
    id: Mapped[str] = mapped_column(String(64), primary_key=True)  # e.g. "alex" or email
    name: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    role: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # technician, supervisor
    status: Mapped[str] = mapped_column(String(20), default="available")   # available|on_duty|off_duty|on_break
    last_seen_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    last_lat: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    last_lon: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    meta: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)

    positions: Mapped[List["CrewPosition"]] = relationship(back_populates="crew", cascade="all, delete-orphan")

class CrewPosition(Base):
    __tablename__ = "crew_positions"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    crew_id: Mapped[str] = mapped_column(String(64), ForeignKey("crew.id", ondelete="CASCADE"), index=True)
    ts: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, index=True)
    lat: Mapped[float] = mapped_column(Float)
    lon: Mapped[float] = mapped_column(Float)
    speed: Mapped[Optional[float]] = mapped_column(Float, nullable=True)   # km/h
    heading: Mapped[Optional[float]] = mapped_column(Float, nullable=True) # degrees 0..359

    crew: Mapped["Crew"] = relationship(back_populates="positions")


# -------- Sites --------
class Site(Base):
    __tablename__ = "sites"
    id: Mapped[str] = mapped_column(String(64), primary_key=True)  # e.g. "site-001"
    name: Mapped[str] = mapped_column(String(200))
    lat: Mapped[float] = mapped_column(Float)
    lon: Mapped[float] = mapped_column(Float)
    address: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    meta: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)

    assets: Mapped[List["Asset"]] = relationship(back_populates="site", cascade="all, delete-orphan")

# -------- Assets (no realtime telemetry) --------
class Asset(Base):
    __tablename__ = "assets"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)   # generator, substation, transformer, etc.
    status: Mapped[str] = mapped_column(String(30), default="unknown")
    meta: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    last_seen_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)  # optional bookkeeping

    site_id: Mapped[Optional[str]] = mapped_column(String(64), ForeignKey("sites.id", ondelete="SET NULL"), index=True, nullable=True)
    site: Mapped[Optional[Site]] = relationship(back_populates="assets")

# -------- Notices (customer-visible planned/active maintenance) --------
class Notice(Base):
    __tablename__ = "notices"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    site_id: Mapped[Optional[str]] = mapped_column(String(64), ForeignKey("sites.id", ondelete="SET NULL"), index=True, nullable=True)
    asset_id: Mapped[Optional[str]] = mapped_column(String(64), ForeignKey("assets.id", ondelete="SET NULL"), index=True, nullable=True)

    kind: Mapped[str] = mapped_column(String(20))  # planned, active, done
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    starts_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True, index=True)
    ends_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, index=True)

# -------- Feedback & Service Requests --------
class Feedback(Base):
    __tablename__ = "feedback"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    site_id: Mapped[Optional[str]] = mapped_column(String(64), ForeignKey("sites.id", ondelete="SET NULL"), index=True, nullable=True)
    asset_id: Mapped[Optional[str]] = mapped_column(String(64), ForeignKey("assets.id", ondelete="SET NULL"), index=True, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, index=True)
    message: Mapped[str] = mapped_column(Text)
    contact: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    rating: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # 1..5

class ServiceRequest(Base):
    __tablename__ = "service_requests"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    site_id: Mapped[Optional[str]] = mapped_column(String(64), ForeignKey("sites.id", ondelete="SET NULL"), index=True, nullable=True)
    asset_id: Mapped[Optional[str]] = mapped_column(String(64), ForeignKey("assets.id", ondelete="SET NULL"), index=True, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, index=True)
    category: Mapped[str] = mapped_column(String(60))
    message: Mapped[str] = mapped_column(Text)
    contact: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="open")  # open, in_progress, closed

# -------- Work Orders (Scheduling / Dispatch to a person) --------
class WorkOrder(Base):
    __tablename__ = "work_orders"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    site_id: Mapped[str] = mapped_column(String(64), ForeignKey("sites.id", ondelete="CASCADE"), index=True)
    asset_id: Mapped[Optional[str]] = mapped_column(String(64), ForeignKey("assets.id", ondelete="SET NULL"), index=True)

    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    priority: Mapped[str] = mapped_column(String(20), default="normal")  # low|normal|high
    scheduled_start: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    scheduled_end: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    status: Mapped[str] = mapped_column(String(20), default="scheduled")
    # scheduled|assigned|in_progress|on_hold|completed|canceled

    assigned_to: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)  # person id/email/name
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
