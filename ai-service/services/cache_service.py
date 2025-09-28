"""
Redis-based caching service for AI analysis results
"""

import os
import json
import asyncio
from typing import Optional, Dict, Any
from datetime import timedelta

import aioredis
from loguru import logger


class CacheService:
    """Redis-based caching service with performance optimization"""

    def __init__(self):
        self.redis_client = None
        self.default_ttl = int(os.getenv("REDIS_TTL", 3600))  # 1 hour default
        self.redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        self.metrics = {
            "hits": 0,
            "misses": 0,
            "sets": 0,
            "errors": 0
        }

    async def initialize(self):
        """Initialize Redis connection"""
        try:
            self.redis_client = aioredis.from_url(
                self.redis_url,
                encoding="utf-8",
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5
            )

            # Test connection
            await self.redis_client.ping()
            logger.info("✅ Redis cache service initialized successfully")

        except Exception as e:
            logger.warning(f"⚠️ Redis unavailable, running without cache: {e}")
            self.redis_client = None

    async def get(self, key: str) -> Optional[str]:
        """Get value from cache"""
        if not self.redis_client:
            self.metrics["misses"] += 1
            return None

        try:
            value = await self.redis_client.get(f"thriftai:{key}")
            if value:
                self.metrics["hits"] += 1
                logger.debug(f"Cache HIT: {key}")
                return value
            else:
                self.metrics["misses"] += 1
                logger.debug(f"Cache MISS: {key}")
                return None

        except Exception as e:
            self.metrics["errors"] += 1
            logger.error(f"Cache GET error for key {key}: {e}")
            return None

    async def set(self, key: str, value: str, ttl: Optional[int] = None) -> bool:
        """Set value in cache with TTL"""
        if not self.redis_client:
            return False

        try:
            ttl = ttl or self.default_ttl
            await self.redis_client.setex(f"thriftai:{key}", ttl, value)
            self.metrics["sets"] += 1
            logger.debug(f"Cache SET: {key} (TTL: {ttl}s)")
            return True

        except Exception as e:
            self.metrics["errors"] += 1
            logger.error(f"Cache SET error for key {key}: {e}")
            return False

    async def delete(self, key: str) -> bool:
        """Delete key from cache"""
        if not self.redis_client:
            return False

        try:
            result = await self.redis_client.delete(f"thriftai:{key}")
            logger.debug(f"Cache DELETE: {key}")
            return bool(result)

        except Exception as e:
            self.metrics["errors"] += 1
            logger.error(f"Cache DELETE error for key {key}: {e}")
            return False

    async def get_json(self, key: str) -> Optional[Dict[str, Any]]:
        """Get JSON object from cache"""
        value = await self.get(key)
        if value:
            try:
                return json.loads(value)
            except json.JSONDecodeError:
                logger.error(f"Invalid JSON in cache for key: {key}")
                await self.delete(key)  # Clean up invalid data
        return None

    async def set_json(self, key: str, value: Dict[str, Any], ttl: Optional[int] = None) -> bool:
        """Set JSON object in cache"""
        try:
            json_str = json.dumps(value, default=str)
            return await self.set(key, json_str, ttl)
        except (TypeError, ValueError) as e:
            logger.error(f"JSON serialization error for key {key}: {e}")
            return False

    async def get_or_set(self, key: str, fetch_func, ttl: Optional[int] = None) -> Any:
        """Get from cache or fetch and set if not exists"""
        # Try cache first
        cached = await self.get_json(key)
        if cached is not None:
            return cached

        # Fetch and cache
        try:
            if asyncio.iscoroutinefunction(fetch_func):
                value = await fetch_func()
            else:
                value = fetch_func()

            if value is not None:
                await self.set_json(key, value, ttl)
            return value

        except Exception as e:
            logger.error(f"Error in get_or_set for key {key}: {e}")
            return None

    async def invalidate_pattern(self, pattern: str) -> int:
        """Invalidate all keys matching a pattern"""
        if not self.redis_client:
            return 0

        try:
            keys = await self.redis_client.keys(f"thriftai:{pattern}")
            if keys:
                deleted = await self.redis_client.delete(*keys)
                logger.info(f"Invalidated {deleted} keys matching pattern: {pattern}")
                return deleted
            return 0

        except Exception as e:
            self.metrics["errors"] += 1
            logger.error(f"Error invalidating pattern {pattern}: {e}")
            return 0

    async def get_metrics(self) -> Dict[str, Any]:
        """Get cache performance metrics"""
        total_requests = self.metrics["hits"] + self.metrics["misses"]
        hit_rate = (self.metrics["hits"] / total_requests) if total_requests > 0 else 0

        cache_info = {}
        if self.redis_client:
            try:
                info = await self.redis_client.info()
                cache_info = {
                    "connected_clients": info.get("connected_clients", 0),
                    "used_memory": info.get("used_memory_human", "0B"),
                    "keyspace_hits": info.get("keyspace_hits", 0),
                    "keyspace_misses": info.get("keyspace_misses", 0),
                }
            except Exception as e:
                logger.error(f"Error getting Redis info: {e}")

        return {
            "service_metrics": self.metrics,
            "hit_rate": round(hit_rate, 3),
            "cache_info": cache_info,
            "redis_connected": self.redis_client is not None
        }

    async def close(self):
        """Close Redis connection"""
        if self.redis_client:
            await self.redis_client.close()
            logger.info("🔄 Redis connection closed")


class InMemoryCache:
    """Fallback in-memory cache when Redis is unavailable"""

    def __init__(self, max_size: int = 1000):
        self.cache = {}
        self.max_size = max_size
        self.access_order = []

    async def get(self, key: str) -> Optional[str]:
        if key in self.cache:
            # Update access order
            self.access_order.remove(key)
            self.access_order.append(key)
            return self.cache[key]
        return None

    async def set(self, key: str, value: str, ttl: Optional[int] = None) -> bool:
        # Simple LRU eviction
        if len(self.cache) >= self.max_size and key not in self.cache:
            oldest = self.access_order.pop(0)
            del self.cache[oldest]

        self.cache[key] = value
        if key in self.access_order:
            self.access_order.remove(key)
        self.access_order.append(key)
        return True

    async def delete(self, key: str) -> bool:
        if key in self.cache:
            del self.cache[key]
            if key in self.access_order:
                self.access_order.remove(key)
            return True
        return False