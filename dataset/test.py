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

structure_a = {
    '1': 'Concrete',
    '2': 'Concrete continuous',
    '3': 'Steel',
    '4': 'Steel continuous',
    '5': 'Prestressed concrete',
    '6': 'Prestressed concrete continuous',
    '7': 'Wood or Timber',
    '8': 'Masonry',
    '9': 'Aluminum, Wrought Iron, or Cast Iron',
    '0': 'Other'
}

structure_b = {
    '1': 'Slab',
    '2': 'Stringer/Multi-beam or Girder',
    '3': 'Girder and Floorbeam System',
    '4': 'Tee Beam',
    '5': 'Box Beam or Girders - Multiple',
    '6': 'Box Beam or Girders - Single or Spread',
    '7': 'Frame (except frame culverts)',
    '8': 'Orthotropic',
    '9': 'Truss - Deck',
    '10': 'Truss - Thru',
    '11': 'Arch - Deck',
    '12': 'Arch - Thru',
    '13': 'Suspension',
    '14': 'Stayed Girder',
    '15': 'Movable - Lift',
    '16': 'Movable - Bascule',
    '17': 'Movable - Swing',
    '18': 'Tunnel',
    '19': 'Culvert (includes frame culverts)',
    '20': 'Mixed types',
    '21': 'Segmental Box Girder',
    '22': 'Channel Beam',
    '00': 'Other'
}

structure_condition = {
    'N': 'Not Applicable',
    '9': 'Excellent Condition',
    '8': 'Very Good Condition',
    '7': 'Good Condition ',
    '6': 'Satisfactory Condition ',
    '5': 'Fair Condition',
    '4': 'Poor Condition ',
    '3': 'Serious Condition ',
    '2': 'Critical Condition ',
    '1': 'Imminent Failure Condition',
    '0': 'Failed Condition'
}

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
        df = pd.read_csv(bridge_csv_path, encoding='utf-8-sig', 
                        usecols=['LAT_016', 'LONG_017', 'STRUCTURE_NUMBER_008', 
                                'STRUCTURE_KIND_043A', 'STRUCTURE_TYPE_043B', 'YEAR_BUILT_027', 'MAIN_UNIT_SPANS_045', 'MAX_SPAN_LEN_MT_048', 'SUPERSTRUCTURE_COND_059', 'SUBSTRUCTURE_COND_060',
                                'DEGREES_SKEW_034'], 
                        dtype=str)
        
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
                
                if lat is not None and lon is not None:
                    if min_lat <= lat <= max_lat and min_lng <= lon <= max_lng:
                        
                        # Basic bridge information
                        name = row['STRUCTURE_NUMBER_008'].strip() if not pd.isna(row['STRUCTURE_NUMBER_008']) else 'No Name Provided'
                        year_built = row['YEAR_BUILT_027'].strip() if not pd.isna(row['YEAR_BUILT_027']) else 'No Year Built Provided'

                        # Structure information
                        structure_043a = row['STRUCTURE_KIND_043A'].strip() if not pd.isna(row['STRUCTURE_KIND_043A']) else 'No Structure Material Provided'
                        structure_043b = row['STRUCTURE_TYPE_043B'].strip() if not pd.isna(row['STRUCTURE_TYPE_043B']) else 'No Structure Type Provided'
                        structure_type_a = structure_a.get(structure_043a, 'No Structure Material Provided')
                        structure_type_b = structure_b.get(structure_043b, 'No Structure Type Provided')

                        # Span information
                        number_of_spans = row['MAIN_UNIT_SPANS_045'].strip() if not pd.isna(row['MAIN_UNIT_SPANS_045']) else 'No Number of Spans in Main Unit Provided'
                        length_max_span = row['MAX_SPAN_LEN_MT_048'].strip() if not pd.isna(row['MAX_SPAN_LEN_MT_048']) else 'No Length of Maximum Span Provided'

                        # Condition information
                        superstructure_cond_059 = row['SUPERSTRUCTURE_COND_059'].strip() if not pd.isna(row['SUPERSTRUCTURE_COND_059']) else 'No Superstructure Condition Provided'
                        substructure_cond_060 = row['SUBSTRUCTURE_COND_060'].strip() if not pd.isna(row["SUBSTRUCTURE_COND_060"]) else 'No Substructure Provided'
                        superstructure_cond = structure_condition.get(superstructure_cond_059, 'No Superstructure Condition Provided')
                        substructure_cond = structure_condition.get(substructure_cond_060, 'No Substructure Condition Provided')

                        # Skew information
                        skew_angle = row['DEGREES_SKEW_034'].strip() if not pd.isna(row['DEGREES_SKEW_034']) else 'No Skew Data Provided'
                        if skew_angle != 'No Skew Data Provided':
                            if skew_angle == '00':
                                skew_angle = '0° (No skew)'
                            elif skew_angle == '99':
                                skew_angle = 'Major variation in skews'
                            else:
                                skew_angle = f"{int(skew_angle)}°"

                        coordinates.append({
                            # Location
                            "latitude": lat,
                            "longitude": lon,
                            "name": name,
                            
                            # Structure details
                            "structure_material": structure_type_a,
                            "structure_type": structure_type_b,
                            "year_built": year_built,
                            "skew_angle": skew_angle,
                            
                            # Span details
                            "number_of_spans": number_of_spans,
                            "length_max_span": length_max_span,
                            
                            # Condition details
                            "superstructure_cond": superstructure_cond,
                            "substructure_cond": substructure_cond,
                        })
            except (ValueError, TypeError, OverflowError):
                continue
        
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
        
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            page = await browser.new_page()
            
            await page.goto(url)
            await page.wait_for_load_state('networkidle')
            
            content = await page.content()
            
            await browser.close()
            
            # Parse the URL pattern
            pattern = r"product/shakemap/([^/]+)/([^/]+)/(\d+)/download/info.json"
            match = re.search(pattern, content)
            
            if match:
                event_code = match.group(1)    
                network = match.group(2)      
                timestamp = match.group(3)      
                
                print(f"Event code: {event_code}")
                print(f"Network: {network}")
                print(f"Timestamp: {timestamp}")
                
                return {
                    "event_code": event_code,
                    "network": network,
                    "timestamp": timestamp
                }
            else:
                raise HTTPException(
                    status_code=404,
                    detail="URL pattern not found"
                )
            
    except Exception as e:
        print(f"Error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error loading page: {str(e)}"
        )

def format_skew_angle(skew: str) -> str:
    try:
        if pd.isna(skew) or skew.strip() == '':
            return 'No skew data'
            
        skew_val = int(skew.strip())
        
        if skew_val == 99:
            return 'Major variation in skews'
        elif skew_val == 0:
            return '0° (No skew)'
        else:
            return f'{skew_val}°'
            
    except (ValueError, TypeError):
        return 'Invalid skew data'

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)