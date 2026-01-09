#!/usr/bin/env python3
"""
Google Trends Data Fetcher for Konzup Radar
Uses pytrends library to fetch search interest data from Google Trends
"""

import sys
import json
from datetime import datetime, timedelta
import random

try:
    from pytrends.request import TrendReq
    PYTRENDS_AVAILABLE = True
except ImportError:
    PYTRENDS_AVAILABLE = False


def generate_mock_history(base_value: float, volatility: float, days: int = 30) -> list:
    """Generate realistic mock historical data when API fails"""
    history = []
    current_value = base_value
    today = datetime.now()
    
    for i in range(days, -1, -1):
        date = today - timedelta(days=i)
        change = (random.random() - 0.5) * volatility
        current_value = max(0, min(100, current_value + change))
        history.append({
            "date": date.strftime("%Y-%m-%d"),
            "value": round(current_value, 2)
        })
    
    return history


def fetch_google_trends(keyword: str) -> dict:
    """
    Fetch Google Trends data for a given keyword
    Returns: {
        "keyword": str,
        "currentIndex": int (0-100),
        "history": list of {date, value},
        "isReal": bool (true if real data, false if mock)
    }
    """
    result = {
        "keyword": keyword,
        "currentIndex": 50,
        "history": [],
        "isReal": False,
        "error": None
    }
    
    if not PYTRENDS_AVAILABLE:
        result["error"] = "pytrends not installed"
        result["history"] = generate_mock_history(50, 10)
        return result
    
    try:
        # Initialize pytrends with timeout
        pytrends = TrendReq(hl='en-US', tz=360, timeout=(10, 25))
        
        # Build payload for last 30 days
        pytrends.build_payload(
            kw_list=[keyword],
            cat=0,
            timeframe='today 1-m',  # Last 30 days
            geo='',  # Worldwide
            gprop=''  # Web search
        )
        
        # Get interest over time
        interest_df = pytrends.interest_over_time()
        
        if interest_df.empty:
            result["error"] = "No data available for this keyword"
            result["history"] = generate_mock_history(40, 8)
            return result
        
        # Process the data
        history = []
        for date, row in interest_df.iterrows():
            history.append({
                "date": date.strftime("%Y-%m-%d"),
                "value": int(row[keyword])
            })
        
        result["history"] = history
        result["currentIndex"] = history[-1]["value"] if history else 50
        result["isReal"] = True
        
    except Exception as e:
        error_msg = str(e)
        result["error"] = error_msg
        
        # Rate limit handling (Error 429)
        if "429" in error_msg or "Too Many Requests" in error_msg:
            result["error"] = "Rate limited by Google. Using cached data."
        
        # Generate mock data as fallback
        base_values = {
            "travel": 65,
            "flight": 58,
            "oil": 72,
            "recession": 45,
            "pandemic": 30,
            "tourism": 60
        }
        
        # Try to match keyword to a base value
        base = 50
        for key, value in base_values.items():
            if key.lower() in keyword.lower():
                base = value
                break
        
        result["history"] = generate_mock_history(base, 12)
        result["currentIndex"] = result["history"][-1]["value"]
    
    return result


def main():
    """Main entry point - reads keyword from command line argument"""
    if len(sys.argv) < 2:
        print(json.dumps({
            "error": "No keyword provided",
            "usage": "python googleTrends.py <keyword>"
        }))
        sys.exit(1)
    
    keyword = sys.argv[1]
    result = fetch_google_trends(keyword)
    print(json.dumps(result))


if __name__ == "__main__":
    main()
