from flask import Flask, jsonify, request
import pickle
import numpy as np

app = Flask(__name__)

# Load the graph information
with open('./graph_info.pickle', 'rb') as handle:
    graph_info = pickle.load(handle)

# Load all graph data scenarios
with open('./all_result.pickle', 'rb') as handle:
    graph_data_all = pickle.load(handle)

# Load bridge and map information
SpreadSheet = np.genfromtxt('bridge_info_v2.csv', delimiter=',', dtype=None, encoding='utf-8-sig')
colNames = SpreadSheet[0, :]
Data = SpreadSheet[1:, :]
node1 = Data[:, np.where(colNames == 'node1')[0][0]].astype(np.int32)
node2 = Data[:, np.where(colNames == 'node2')[0][0]].astype(np.int32)
edge = [(n1, n2) for n1, n2 in zip(node1, node2)]

SpreadSheet_map = np.genfromtxt('map.csv', delimiter=',', dtype=None, encoding='utf-8-sig')
colNames_map = SpreadSheet_map[0, :]
node_file = SpreadSheet_map[1:, :]
id_list = node_file[:, np.where(colNames_map == 'id')[0][0]].astype(np.int32)
lat_list = node_file[:, np.where(colNames_map == 'lat')[0][0]].astype(np.float32)
lon_list = node_file[:, np.where(colNames_map == 'lon')[0][0]].astype(np.float32)

@app.route('/get_node_data', methods=['GET'])
def get_node_data():
    scenario_id = request.args.get('scenario_id', default=0, type=int)
    node_data = graph_data_all[scenario_id]['node_res'].squeeze().tolist()
    return jsonify(node_data)

@app.route('/get_edge_data', methods=['GET'])
def get_edge_data():
    scenario_id = request.args.get('scenario_id', default=0, type=int)
    edge_data = graph_data_all[scenario_id]['edge_feat'].squeeze().tolist()
    return jsonify(edge_data)

@app.route('/get_map_nodes', methods=['GET'])
def get_map_nodes():
    nodes = [{'id': int(id), 'lat': float(lat), 'lon': float(lon)} for id, lat, lon in zip(id_list, lat_list, lon_list)]
    return jsonify(nodes)

@app.route('/get_map_edges', methods=['GET'])
def get_map_edges():
    return jsonify([{'node1': int(n1), 'node2': int(n2)} for n1, n2 in edge])

if __name__ == '__main__':
    app.run(debug=True)