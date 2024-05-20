import pickle
import numpy as np

################################################################################
with open('./graph_info.pickle', 'rb') as handle:
    graph_info = pickle.load(handle)

# n_node
# n_bridge: will damage
# n_road: won't damage at all
# n_edge: n_road + n_bridge
# bridge_list
# road_list
# edge_list: bridge_list + road_list
print(graph_info)

################################################################################
with open('./all_result.pickle', 'rb') as handle:
    graph_data_all = pickle.load(handle)
    
# inlucde 200 scenarios
idx = 0
print(len(graph_data_all))
print(graph_data_all[idx].keys())

graph_data = graph_data_all[idx]

### node level connectivity
print(graph_data['node_res'].squeeze().shape)

### link connectivity probability
print(graph_data['edge_feat'].squeeze().shape)


################################################################################
SpreadSheet = np.genfromtxt('bridge_info_v2.csv', delimiter=',', dtype=None, encoding='utf-8-sig')
colNames = SpreadSheet[0, :]
Data = SpreadSheet[1:, :]

node1 = Data[:, np.where(colNames == 'node1')[0][0]].astype(np.int32)
node2 = Data[:, np.where(colNames == 'node2')[0][0]].astype(np.int32)

edge = [(n1, n2) for n1, n2 in zip(node1, node2)]
temp = list(set(edge))
series_id = Data[:, np.where(colNames == 'serial class')[0][0]].astype(np.int32)
bridge_class = Data[:, np.where(colNames == 'NBI class')[0][0]].astype(np.int32)
bridge_id = Data[:, np.where(colNames == 'structure member')[0][0]]
skew = Data[:, np.where(colNames == 'degrees_skew_034')[0][0]].astype(np.int32)
num_span = Data[:, np.where(colNames == 'main_unit_spans_045')[0][0]].astype(np.int32)
max_span_length = Data[:, np.where(colNames == 'max_span_len_mt_048')[0][0]].astype(np.int32)
total_length = Data[:, np.where(colNames == 'structure_len_mt_049')[0][0]].astype(np.int32)


################################################################################
SpreadSheet = np.genfromtxt('map.csv', delimiter=',', dtype=None, encoding='utf-8-sig')
colNames = SpreadSheet[0, :]
node_file = SpreadSheet[1:, :]
id_list = node_file[:, np.where(colNames == 'id')[0][0]].astype(np.int32)
lat_list = node_file[:, np.where(colNames == 'lat')[0][0]].astype(np.float32)
lon_list = node_file[:, np.where(colNames == 'lon')[0][0]].astype(np.float32)
print(node_file)


def load_node_data():
    df = pd.read_csv('bridge_info_v2.csv', usecols=['node1', 'node2', 'lat_016', 'long_017'], dtype={'lat_016': float, 'long_017': float})
    df['lat_016'] = df['lat_016'].astype(float)
    df['long_017'] = df['long_017'].astype(float)
    return df

@app.route('/api/plot', methods=['POST'])
def plot_nodes():
    data = request.get_json()
    start_lat = float(data['startLat'])
    start_lon = float(data['startLon'])
    end_lat = float(data['endLat'])
    end_lon = float(data['endLon'])

    node_data = load_node_data()

    # Calculate distances to start and end points for node1
    node_data['start_dist'] = np.sqrt((node_data['lat_016'] - start_lat)**2 + (node_data['long_017'] - start_lon)**2)
    # Calculate distances to start and end points for node2
    node_data['end_dist'] = np.sqrt((node_data['lat_016'] - end_lat)**2 + (node_data['long_017'] - end_lon)**2)

    # Find closest node1 to start and closest node2 to end
    start_node = node_data.loc[node_data['start_dist'].idxmin()]
    end_node = node_data.loc[node_data['end_dist'].idxmin()]

    response = {
        'start_node': {
            'id': start_node['node1'],
            'lat': start_node['lat_016'],
            'lon': start_node['long_017']
        },
        'end_node': {
            'id': end_node['node2'],
            'lat': end_node['lat_016'],
            'lon': end_node['long_017']
        }
    }
    return jsonify(response)
