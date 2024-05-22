from flask import *
import pickle
import numpy as np
import pandas as pd
from flask_cors import CORS
import csv

app = Flask(__name__)
CORS(app)

@app.route('/')
def home():
    return "Welcome to the Flask App!"

@app.route('/data')
def get_data():
    # Load graph information
    with open('./graph_info.pickle', 'rb') as handle:
        graph_info = pickle.load(handle)
    
    edge_list = graph_info.get('edge_list')

    # Load all results
    with open('./all_result.pickle', 'rb') as handle:
        graph_data_all = pickle.load(handle)
    idx = 0
    graph_data = graph_data_all[idx]


    # Load map information
    SpreadSheet_map = np.genfromtxt('map.csv', delimiter=',', dtype=None, encoding='utf-8-sig')
    colNames_map = SpreadSheet_map[0, :]
    node_file = SpreadSheet_map[1:, :]
    id_list = [int(id) for id in node_file[:, np.where(colNames_map == 'id')[0][0]]]  # Convert to Python int
    lat_list = [float(lat) for lat in node_file[:, np.where(colNames_map == 'lat')[0][0]]]  # Convert to Python float
    lon_list = [float(lon) for lon in node_file[:, np.where(colNames_map == 'lon')[0][0]]]  # Convert to Python float

    # Prepare data to send as JSON
    data = {
        "graph_info": graph_info,
        "edge_list": edge_list,
        "map_nodes": {
            "ids": id_list,
            "lats": lat_list,
            "lons": lon_list
        },
        "node_res": graph_data['node_res'].squeeze().tolist(),
        "edge_feat": graph_data['edge_feat'].squeeze().tolist()
    }

    return jsonify(data)

####################################################

def fetch_node_data(node_id):
    csv_file_path = 'map.csv'
    with open(csv_file_path, mode='r', encoding='utf-8-sig') as file:
        reader = csv.DictReader(file)
        for row in reader:
            if int(row['id']) == node_id:
                return {
                    "node_id": node_id,
                    "latitude": row['lat'],
                    "longitude": row['lon']
                }
    return {"node_id": node_id, "error": "Node data not found"}

@app.route('/data/nodes')
def get_nodes_data():
    node1_id = request.args.get('node1', type=int)
    node2_id = request.args.get('node2', type=int)

    node1_data = fetch_node_data(node1_id)
    node2_data = fetch_node_data(node2_id)

    data = {
        "node1": node1_data,
        "node2": node2_data
    }

    return jsonify(data)

################################################
@app.route('/data/bridges')
def get_bridges_data():
    # Load map information
    SpreadSheet_map = np.genfromtxt('map.csv', delimiter=',', dtype=None, encoding='utf-8-sig')
    colNames_map = SpreadSheet_map[0, :]
    node_file = SpreadSheet_map[1:, :]
    id_list = [int(id) for id in node_file[:, np.where(colNames_map == 'id')[0][0]]]  # Convert to Python int
    lat_list = [float(lat) for lat in node_file[:, np.where(colNames_map == 'lat')[0][0]]]  # Convert to Python float
    lon_list = [float(lon) for lon in node_file[:, np.where(colNames_map == 'lon')[0][0]]]  # Convert to Python float


    # Load bridge information
    SpreadSheet = np.genfromtxt('bridge_info_v2.csv', delimiter=',', dtype=None, encoding='utf-8-sig')
    colNames = SpreadSheet[0, :]
    Data = SpreadSheet[1:, :]
    node1 = [int(n) for n in Data[:, np.where(colNames == 'node1')[0][0]]] 
    node2 = [int(n) for n in Data[:, np.where(colNames == 'node2')[0][0]]] 
    edge = [(n1, n2) for n1, n2 in zip(node1, node2)]

    # load bridge information
    series_id = Data[:, np.where(colNames == 'serial class')[0][0]].astype(np.int32)
    bridge_class = Data[:, np.where(colNames == 'NBI class')[0][0]].astype(np.int32)
    bridge_id = Data[:, np.where(colNames == 'structure member')[0][0]]
    skew = Data[:, np.where(colNames == 'degrees_skew_034')[0][0]].astype(np.int32)
    num_span = Data[:, np.where(colNames == 'main_unit_spans_045')[0][0]].astype(np.int32)
    max_span_length = Data[:, np.where(colNames == 'max_span_len_mt_048')[0][0]].astype(np.int32)
    total_length = Data[:, np.where(colNames == 'structure_len_mt_049')[0][0]].astype(np.int32)

    bridge_info = [{
        "node1": int(n1),
        "node2": int(n2),
        "series_id": int(series),
        "bridge_class": int(b_class),
        "bridge_id": str(b_id),
        "skew": int(sk),
        "num_span": int(num_sp),
        "max_span_length": int(max_sp_len),
        "total_length": int(tot_len)
    } for n1, n2, series, b_class, b_id, sk, num_sp, max_sp_len, tot_len in zip(
        node1, node2, series_id, bridge_class, bridge_id, skew, num_span, max_span_length, total_length
    )]

    data = {
        "bridges": bridge_info,
        "edges": edge,
        "map_nodes": {
            "ids": id_list,
            "lats": lat_list,
            "lons": lon_list
        }
    }

    return jsonify(data)

@app.route('/data/roads')
def get_road_data():
    # Load graph information
    with open('./graph_info.pickle', 'rb') as handle:
        graph_info = pickle.load(handle)
    
    road_list = graph_info.get('road_list')
    # load map data
    SpreadSheet_map = np.genfromtxt('map.csv', delimiter=',', dtype=None, encoding='utf-8-sig')
    colNames_map = SpreadSheet_map[0, :]
    node_file = SpreadSheet_map[1:, :]
    id_list = [int(id) for id in node_file[:, np.where(colNames_map == 'id')[0][0]]]  # Convert to Python int
    lat_list = [float(lat) for lat in node_file[:, np.where(colNames_map == 'lat')[0][0]]]  # Convert to Python float
    lon_list = [float(lon) for lon in node_file[:, np.where(colNames_map == 'lon')[0][0]]]  # Convert to Python float

    data = {
        "roads": road_list,
        "map_nodes": {
            "ids": id_list,
            "lats": lat_list,
            "lons": lon_list
        }

    }
    return jsonify(data)






if __name__ == '__main__':
    app.run(debug=True)