from flask import Flask, jsonify
import pickle
import numpy as np
from flask_cors import CORS

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

    # Load all results
    with open('./all_result.pickle', 'rb') as handle:
        graph_data_all = pickle.load(handle)
    idx = 0
    graph_data = graph_data_all[idx]

    # Load bridge information
    SpreadSheet = np.genfromtxt('bridge_info_v2.csv', delimiter=',', dtype=None, encoding='utf-8-sig')
    colNames = SpreadSheet[0, :]
    Data = SpreadSheet[1:, :]
    node1 = [int(n) for n in Data[:, np.where(colNames == 'node1')[0][0]]]  # Convert to Python int
    node2 = [int(n) for n in Data[:, np.where(colNames == 'node2')[0][0]]]  # Convert to Python int
    edge = [(n1, n2) for n1, n2 in zip(node1, node2)]

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
        "node_res_shape": graph_data['node_res'].squeeze().shape,
        "edge_feat_shape": graph_data['edge_feat'].squeeze().shape,
        "edges": edge,
        "map_nodes": {
            "ids": id_list,
            "lats": lat_list,
            "lons": lon_list
        }
    }

    return jsonify(data)

if __name__ == '__main__':
    app.run(debug=True)