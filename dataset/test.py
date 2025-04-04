from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
from typing import List, Dict
from pydantic import BaseModel
import httpx  # Add this import for making HTTP requests
import re  # Add this for regex pattern matching
from datetime import datetime
from bs4 import BeautifulSoup  # Add this import
from playwright.async_api import async_playwright

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

class Coordinate(BaseModel):
    latitude: float
    longitude: float

class BridgeInfo(BaseModel):
    latitude: float
    longitude: float
    name: str  # Add name field

class BridgeResponse(BaseModel):
    bridge_coordinates: List[BridgeInfo]

def dms_to_decimal(dms: int, is_latitude: bool = True) -> float:
    try:
        degrees = int(dms / 1000000) 
        minutes = int((dms % 1000000) / 10000)
        seconds = (dms % 10000) / 100.0
        decimal_degrees = degrees + minutes / 60 + seconds / 3600
        if not is_latitude:
            decimal_degrees *= -1
        return decimal_degrees
    except:
        return None

@app.get("/data/bridge-info/{dataset}")
async def bridge_information(
    dataset: str,
    min_lat: float,
    max_lat: float,
    min_lng: float,
    max_lng: float
):
    try:
        bridge_csv_path = f'./{dataset}/bridges.csv'
        df = pd.read_csv(bridge_csv_path, encoding='utf-8-sig', usecols=['LAT_016', 'LONG_017', 'STRUCTURE_NUMBER_008'], dtype=str)
        
        if 'LAT_016' not in df.columns or 'LONG_017' not in df.columns:
            raise HTTPException(status_code=400, detail="Required columns not found in CSV")
        
        coordinates = []
        for _, row in df.iterrows():
            try:
                if pd.isna(row['LAT_016']) or pd.isna(row['LONG_017']) or \
                   row['LAT_016'].strip() == '' or row['LONG_017'].strip() == '':
                    continue
                
                lat_float = float(row['LAT_016'].strip())
                lon_float = float(row['LONG_017'].strip())
                
                if not np.isfinite(lat_float) or not np.isfinite(lon_float):
                    continue
                
                lat_val = int(lat_float)
                lon_val = int(lon_float)
                
                lat = dms_to_decimal(lat_val, True)
                lon = dms_to_decimal(lon_val, False)
                
                # Only include bridges within the bounding box
                if lat is not None and lon is not None:
                    if min_lat <= lat <= max_lat and min_lng <= lon <= max_lng:
                        coordinates.append({
                            "latitude": lat,
                            "longitude": lon,
                            "name": row['STRUCTURE_NUMBER_008'].strip() if not pd.isna(row['STRUCTURE_NUMBER_008']) else "Unknown"
                        })
            except (ValueError, TypeError, OverflowError):
                continue
        
        # Return empty list instead of raising an error
        return {"bridge_coordinates": coordinates}
    
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Bridge data file not found at {bridge_csv_path}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing bridge data: {str(e)}")

# Add new endpoint to fetch ShakeMap contribution time
@app.get("/earthquake/shakemap-info/{event_id}")
async def get_shakemap_info(event_id: str):
    try:
        url = f"https://earthquake.usgs.gov/earthquakes/eventpage/{event_id}/shakemap/intensity"
        print("test")
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            page = await browser.new_page()
            
            await page.goto(url)
            await page.wait_for_load_state('networkidle')
            
            content = await page.content()
            
            await browser.close()
            
            # Parse the timestamp from the href
            pattern = r"shakemap/\d+/\w+/(\d+)/download/intensity.jpg"
            match = re.search(pattern, content)
            
            if match:
                timestamp = match.group(1)  # This will be "1734300539331"
                print(f"Found timestamp: {timestamp}")
                
                return {
                    "contribution_timestamp": timestamp
                }
            else:
                raise HTTPException(
                    status_code=404,
                    detail="Timestamp not found in href"
                )
            
    except Exception as e:
        print(f"Error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error loading page: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)