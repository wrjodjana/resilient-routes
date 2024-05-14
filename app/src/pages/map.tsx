import React from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup } from "react-leaflet";
import Sidebar from "../components/map/sidebar";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
});

const BaseMap = () => {
  return (
    <div className="flex h-screen">
      <div className="w-5/6 h-full">
        <MapContainer center={[37.8272, -122.2913]} zoom={13} className="h-full">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors' />
          {/* Golden Gate Bridge markers */}
          <Marker position={[37.82547226370507, -122.47916063637638]} icon={DefaultIcon} />
          <Marker position={[37.81083193016443, -122.47745582485439]} icon={DefaultIcon} />

          {/* Edge between Golden Gate Bridge markers */}
          <Polyline
            positions={[
              [37.82547226370507, -122.47916063637638],
              [37.81083193016443, -122.47745582485439],
            ]}
            color="red"
          >
            <Popup>
              <div>
                <h3>Golden Gate Bridge</h3>
                <p>
                  The Golden Gate Bridge is an iconic suspension bridge spanning the Golden Gate, the one-mile-wide strait connecting San Francisco Bay and the Pacific Ocean. It was completed in 1937 and is considered one of the Wonders of
                  the Modern World by the American Society of Civil Engineers.
                </p>
                <p>
                  The bridge is known for its stunning views and architectural beauty, but it has also been the site of numerous suicides and accidents over the years. Despite safety measures, the bridge's height and accessibility make it a
                  dangerous structure.
                </p>
              </div>
            </Popup>
          </Polyline>

          {/* Interstate 280 markers */}
          <Marker position={[37.33229876756334, -122.05867558065432]} icon={DefaultIcon} />
          <Marker position={[37.772367432479115, -122.39790204245755]} icon={DefaultIcon} />

          {/* Edge representing Interstate 280 */}
          <Polyline
            positions={[
              [37.33229876756334, -122.05867558065432],
              [37.38063496653439, -122.08523851633073],
              [37.42681421682874, -122.14228391647341],
              [37.459090609335425, -122.19725608825685],
              [37.48642934373528, -122.23609328269959],
              [37.52340089311685, -122.27834939956665],
              [37.58031892655541, -122.33673048377442],
              [37.63371844225327, -122.38304138183595],
              [37.6864928455509, -122.40520477294923],
              [37.72400245666061, -122.39893436431887],
              [37.772367432479115, -122.39790204245755],
            ]}
            color="blue"
          >
            <Popup>
              <div>
                <h3>Interstate 280</h3>
                <p>
                  Interstate 280 (I-280) is a major north-south Interstate Highway in the San Francisco Bay Area. It runs from the San Jose area to San Francisco, connecting Silicon Valley with San Francisco and providing access to numerous
                  cities and towns along the Peninsula.
                </p>
                <p>
                  I-280 is known for its scenic views of the Santa Cruz Mountains and Crystal Springs Reservoir. However, like many highways, it has seen its share of accidents and traffic congestion over the years. The high speeds and
                  heavy traffic on the highway can make it a dangerous stretch of road.
                </p>
              </div>
            </Popup>
          </Polyline>
        </MapContainer>
      </div>
      <Sidebar />
    </div>
  );
};

export default BaseMap;
