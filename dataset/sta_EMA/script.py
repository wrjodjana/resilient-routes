import numpy as np

# Constants from transform.py
x_min, x_max = -70.674213, -71.600974
y_min, y_max = 42.042274, 42.700273
x_scale = abs(-70.674213 + 71.600974)
y_scale = abs(42.042274 - 42.700273)

# Load the modified coordinates along with IDs
data = np.loadtxt('modified_coord.csv', delimiter=',', skiprows=1, usecols=(0, 3, 4))

# Convert normalized coordinates to regular coordinates and append them to the data
converted_data = []
for row in data:
    id, norm_lon, norm_lat = row
    lon = norm_lon * x_scale + x_min
    lat = norm_lat * y_scale + y_min
    converted_data.append([int(id), lon, lat, norm_lon, norm_lat,])

# Save the extended data to a new CSV file
np.savetxt('converted_coordinates.csv', converted_data, delimiter=',', 
           header='ID,Longitude,Latitude,NormalizedLongitude,NormalizedLatitude,', comments='', 
           fmt=['%d', '%f', '%f', '%f', '%f'])