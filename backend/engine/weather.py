import httpx
from typing import Tuple, Dict, Any
from backend.config import settings

# In-memory cache for weather to avoid hammering APIs
_weather_cache: Dict[str, Tuple[float, float, float]] = {}

def get_kinetic_weather(lat: float = settings.DEFAULT_LAT, lon: float = settings.DEFAULT_LON) -> Dict[str, Any]:
    """
    Fetch ambient temperature (°C), relative humidity (%), and pressure from:
    1. OpenWeatherMap (if OPENWEATHER_API_KEY is configured)
    2. WeatherAPI (if WEATHERAPI_KEY is configured)
    3. Open-Meteo (default, free, no API key required)
    4. Cached Telemetry or MRPL DCS Baseline fallback (30.0°C, 75.0% RH)
    """
    cache_key = f"{round(lat, 2)},{round(lon, 2)}"

    # 1. Check OpenWeatherMap if key is provided
    if settings.OPENWEATHER_API_KEY:
        try:
            url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={settings.OPENWEATHER_API_KEY}&units=metric"
            with httpx.Client(timeout=3.0) as client:
                resp = client.get(url)
                if resp.status_code == 200:
                    data = resp.json()
                    main = data.get("main", {})
                    temp = float(main.get("temp", 30.0))
                    rh = float(main.get("humidity", 75.0))
                    pressure = float(main.get("pressure", 1013.25))
                    _weather_cache[cache_key] = (temp, rh, pressure)
                    return {
                        "temperature_c": temp,
                        "relative_humidity_pct": rh,
                        "pressure_hpa": pressure,
                        "source": "OpenWeatherMap Live API"
                    }
        except Exception:
            pass

    # 2. Check WeatherAPI if key is provided
    if settings.WEATHERAPI_KEY:
        try:
            url = f"https://api.weatherapi.com/v1/current.json?key={settings.WEATHERAPI_KEY}&q={lat},{lon}"
            with httpx.Client(timeout=3.0) as client:
                resp = client.get(url)
                if resp.status_code == 200:
                    data = resp.json()
                    current = data.get("current", {})
                    temp = float(current.get("temp_c", 30.0))
                    rh = float(current.get("humidity", 75.0))
                    pressure = float(current.get("pressure_mb", 1013.25))
                    _weather_cache[cache_key] = (temp, rh, pressure)
                    return {
                        "temperature_c": temp,
                        "relative_humidity_pct": rh,
                        "pressure_hpa": pressure,
                        "source": "WeatherAPI Live API"
                    }
        except Exception:
            pass

    # 3. Default: Open-Meteo (Free, No Key Required)
    try:
        url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m,surface_pressure"
        with httpx.Client(timeout=3.0) as client:
            resp = client.get(url)
            if resp.status_code == 200:
                data = resp.json()
                current = data.get("current", {})
                temp = float(current.get("temperature_2m", 30.0))
                rh = float(current.get("relative_humidity_2m", 75.0))
                pressure = float(current.get("surface_pressure", 1013.25))
                _weather_cache[cache_key] = (temp, rh, pressure)
                return {
                    "temperature_c": temp,
                    "relative_humidity_pct": rh,
                    "pressure_hpa": pressure,
                    "source": "Open-Meteo Live Telemetry (Keyless)"
                }
    except Exception:
        pass
    
    # 4. Check cache
    if cache_key in _weather_cache:
        temp, rh, pressure = _weather_cache[cache_key]
        return {
            "temperature_c": temp,
            "relative_humidity_pct": rh,
            "pressure_hpa": pressure,
            "source": "Cached Station Telemetry"
        }
    
    # 5. Fallback to MRPL DCS Baseline (Mangalore Coastal Refinery)
    return {
        "temperature_c": 30.0,
        "relative_humidity_pct": 75.0,
        "pressure_hpa": 1013.25,
        "source": "MRPL DCS Station (Fallback Baseline)"
    }
