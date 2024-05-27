from flask import *
import pickle
import numpy as np
import pandas as pd
from flask_cors import CORS
import csv
from collections import *
import heapq

app = Flask(__name__)
CORS(app)

@app.route('/')
def home():
    return "Welcome to the Flask App!"

@app.route('/data/<dataset>')
def get_data(dataset):
    # Load graph information
    graph_info_path = f'./{dataset}/graph_info.pickle'
    with open(graph_info_path, 'rb') as handle:
        graph_info = pickle.load(handle)
    
    edge_list = graph_info.get('edge_list')

    # Load all results
    all_result_path = f'./{dataset}/all_result.pickle'
    with open(all_result_path, 'rb') as handle:
        graph_data_all = pickle.load(handle)
    idx = 0
    graph_data = graph_data_all[idx]

    # Load map information
    map_csv_path = f'./{dataset}/map.csv'
    SpreadSheet_map = np.genfromtxt(map_csv_path, delimiter=',', dtype=None, encoding='utf-8-sig')
    colNames_map = SpreadSheet_map[0, :]
    node_file = SpreadSheet_map[1:, :]
    id_list = [int(id) for id in node_file[:, np.where(colNames_map == 'id')[0][0]]]
    lat_list = [float(lat) for lat in node_file[:, np.where(colNames_map == 'lat')[0][0]]]
    lon_list = [float(lon) for lon in node_file[:, np.where(colNames_map == 'lon')[0][0]]]

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

@app.route('/data/nodes/<dataset>')
def get_nodes_data(dataset):
    node1_id = request.args.get('node1', type=int)
    node2_id = request.args.get('node2', type=int)

    node1_data = fetch_node_data(node1_id, dataset)
    node2_data = fetch_node_data(node2_id, dataset)

    graph_info_path = f'./{dataset}/graph_info.pickle'
    with open(graph_info_path, 'rb') as handle:
        graph_info = pickle.load(handle)
    edge_list = graph_info.get('edge_list')

    graph = defaultdict(list)
    for start, end in edge_list:
        graph[start].append(end)
        graph[end].append(start)

    path = dijkstra(graph, node1_id, node2_id)

    data = {
        "node1": node1_data,
        "node2": node2_data,
        "path": path
    }

    return jsonify(data)

def fetch_node_data(node_id, dataset):
    csv_file_path = f'./{dataset}/map.csv'
    with open(csv_file_path, mode='r', encoding='utf-8-sig') as file:
        reader = csv.DictReader(file)
        for row in reader:
            if int(row['id']) == node_id:
                return {
                    "node_id": node_id,
                    "latitude": float(row['lat']),
                    "longitude": float(row['lon'])
                }
    return {"node_id": node_id, "error": "Node data not found"}

def dijkstra(graph, start, end):
    min_heap = [(0, start, [])]
    visited = set()
    while min_heap:
        (cost, vertex, path) = heapq.heappop(min_heap)
        if vertex not in visited:
            visited.add(vertex)
            path = path + [vertex]

            if vertex == end:
                return path

            for next_vertex in graph[vertex]:
                if next_vertex not in visited:
                    heapq.heappush(min_heap, (cost + 1, next_vertex, path))
    return []



################################################
@app.route('/data/bridges/<dataset>')
def get_bridges_data(dataset):
    # Load map information
    map_csv_path = f'./{dataset}/map.csv'
    SpreadSheet_map = np.genfromtxt(map_csv_path, delimiter=',', dtype=None, encoding='utf-8-sig')
    colNames_map = SpreadSheet_map[0, :]
    node_file = SpreadSheet_map[1:, :]
    id_list = [int(id) for id in node_file[:, np.where(colNames_map == 'id')[0][0]]]
    lat_list = [float(lat) for lat in node_file[:, np.where(colNames_map == 'lat')[0][0]]]
    lon_list = [float(lon) for lon in node_file[:, np.where(colNames_map == 'lon')[0][0]]]

    # Load bridge information
    bridge_csv_path = f'./{dataset}/bridge_info.csv'
    SpreadSheet = np.genfromtxt(bridge_csv_path, delimiter=',', dtype=None, encoding='utf-8-sig')
    colNames = SpreadSheet[0, :]
    Data = SpreadSheet[1:, :]
    node1 = [int(n) for n in Data[:, np.where(colNames == 'node1')[0][0]]]
    node2 = [int(n) for n in Data[:, np.where(colNames == 'node2')[0][0]]]

    # Load edge from pickle file
    graph_info_path = f'./{dataset}/graph_info.pickle'
    with open(graph_info_path, 'rb') as handle:
        graph_info = pickle.load(handle)
    edge_list = graph_info.get('edge_list')

    # Load other bridge information
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
        "edges": edge_list,
        "map_nodes": {
            "ids": id_list,
            "lats": lat_list,
            "lons": lon_list
        }
    }

    return jsonify(data)

@app.route('/data/roads/<dataset>')
def get_road_data(dataset):
    # Load graph information
    graph_info_path = f'./{dataset}/graph_info.pickle'
    print(graph_info_path)
    with open(graph_info_path, 'rb') as handle:
        graph_info = pickle.load(handle)
    
    road_list = graph_info.get('road_list')

    # load map data
    map_csv_path = f'./{dataset}/map.csv'
    SpreadSheet_map = np.genfromtxt(map_csv_path, delimiter=',', dtype=None, encoding='utf-8-sig')
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