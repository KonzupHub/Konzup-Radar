#!/usr/bin/env python3
"""
Google Trends Data Fetcher for Konzup Radar
Uses pytrends library to fetch search interest data from Google Trends

NO MOCK DATA - Returns empty history if API fails
"""

import sys
import json

try:
    from pytrends.request import TrendReq
    PYTRENDS_AVAILABLE = True
except ImportError:
    PYTRENDS_AVAILABLE = False


def fetch_google_trends(keyword: str) -> dict:
    """
    Fetch Google Trends data for a given keyword
    Returns: {
        "keyword": str,
        "currentIndex": int (0-100, or -1 if no data),
        "history": list of {date, value} (empty if no real data),
        "isReal": bool (true ONLY if real data from API)
    }
    """
    result = {
        "keyword": keyword,
        "currentIndex": -1,
        "history": [],
        "isReal": False,
        "error": None
    }
    
    if not PYTRENDS_AVAILABLE:
        result["error"] = "pytrends not installed"
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
            return result
        
        # Process the data
        history = []
        for date, row in interest_df.iterrows():
            history.append({
                "date": date.strftime("%Y-%m-%d"),
                "value": int(row[keyword])
            })
        
        result["history"] = history
        result["currentIndex"] = history[-1]["value"] if history else -1
        result["isReal"] = True
        
    except Exception as e:
        error_msg = str(e)
        result["error"] = error_msg
        
        # Rate limit handling (Error 429)
        if "429" in error_msg or "Too Many Requests" in error_msg:
            result["error"] = "Rate limited by Google. Try again later."
        
        # NO MOCK DATA - just return empty history
        # Card will be hidden in frontend
    
    return result


def main():
    """Main entry point - reads keyword from command line argument"""
    if len(sys.argv) < 2:
        print(json.dumps({
            "keyword": "",
            "currentIndex": -1,
            "history": [],
            "isReal": False,
            "error": "No keyword provided"
        }))
        sys.exit(1)
    
    keyword = sys.argv[1]
    result = fetch_google_trends(keyword)
    print(json.dumps(result))


if __name__ == "__main__":
    main()
