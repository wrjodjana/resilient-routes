from classes import Coordinates
from func import cal_GK15
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from playwright.async_api import async_playwright
from scipy.stats import norm
import pandas as pd
import numpy as np
import re
import httpx

app = FastAPI()

app.add_middleware(
  CORSMiddleware,
  allow_origins=["http://localhost:3000"],
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)

USGS_API = "https://earthquake.usgs.gov/fdsnws/event/1/query"

@app.post("/api/earthquakes")
async def fetch_earthquakes(coords: Coordinates):
  center_lat = (coords.north + coords.south) / 2
  center_lng = (coords.east + coords.west) / 2
  params = {
    "format": "geojson",
    "latitude": center_lat,
    "longitude": center_lng,
    "maxradiuskm": "100",
    "orderby": "magnitude",
    "producttype": "shakemap",
    "minmagnitude": "4.5",
    "limit": "1",
    "starttime": "2010-01-01",
  }

  async with httpx.AsyncClient(timeout=30.0) as client:
    resp = await client.get(USGS_API, params=params)

    if resp.status_code != 200:
      raise HTTPException(status_code=500, detail="Failed to fetch nearest earthquakes")

    data = resp.json()
    return data['features'][0]

@app.get("/api/shakemap")
async def fetch_shakemap(event_id: str):
  event_url = f"https://earthquake.usgs.gov/earthquakes/eventpage/{event_id}/shakemap/intensity"

  async with async_playwright() as p:
    browser = await p.chromium.launch()
    page = await browser.new_page()

    await page.goto(event_url)
    await page.wait_for_load_state('networkidle')

    content = await page.content()
    await browser.close()

    pattern = r"product/shakemap/([^/]+)/([^/]+)/(\d+)/download/info.json"
    match = re.search(pattern, content)

    event_code = match.group(1)
    network = match.group(2)
    timestamp = match.group(3)
            
    shakemap_url = f"https://earthquake.usgs.gov/product/shakemap/{event_code}/{network}/{timestamp}/download/info.json"
            
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get(shakemap_url)

        if resp.status_code != 200:
          raise HTTPException(status_code=500, detail="Failed to fetch shakemap data.")

        data = resp.json()
        return data

@app.post("/api/bridges")
async def fetch_bridges(coords: Coordinates):
  df = pd.read_csv("datasets/bridges.csv")
  filtered_df = df[(df['LATITUDE'] >= coords.south) & (df['LATITUDE'] <= coords.north) 
                & (df['LONGITUDE'] >= coords.west) & (df['LONGITUDE'] <= coords.east)]

  bridges_data = filtered_df.where(pd.notna(filtered_df), None).to_dict(orient='records')

  for i, bridge in enumerate(bridges_data):
     bridge['id'] = i
    
  return bridges_data

@app.post("/api/bridge_failures")
async def calc_prob_failures(payload: dict):
    shakemap_data = payload['shakemap_data']
    bridges = payload['bridges']


    bridge_probs = []

    for bridge in bridges:
      SA03 = float(shakemap_data["ground_motions"]["SA03"]["max"])
      SA10 = float(shakemap_data["ground_motions"]["SA10"]["max"])

      medians = np.array([
        bridge['SLIGHT_MEDIAN'],
        bridge['MODERATE_MEDIAN'],
        bridge['EXTENSIVE_MEDIAN'],
        bridge['COMPLETE_MEDIAN']
      ])

      beta = bridge['BETA']
      K_skew = bridge['K_SKEW']
      K_3D = bridge['K_3D_VAL']
      I_shape = bridge['I_SHAPE']

      K_shape = 2.5 * SA10 / SA03

      if I_shape == 0:
          slight_factor = 1
      elif I_shape == 1:
          slight_factor = min(1, K_shape)
      
      medians_modify = medians.copy()
      medians_modify[0] = medians[0] * slight_factor
      medians_modify[1] = medians[1] * K_skew * K_3D
      medians_modify[2] = medians[2] * K_skew * K_3D
      medians_modify[3] = medians[3] * K_skew * K_3D

      damage_prob = norm.cdf(np.log(SA10/medians_modify[2])/beta)

      bridge_probs.append({
         "bridge_id": bridge["id"],
         "latitude": bridge["LATITUDE"],
         "longitude": bridge["LONGITUDE"],
         "failure_probability": float(damage_prob)
      })
    
    return bridge_probs


@app.get("/")
async def root():
    return {"message": "FastAPI is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
                








