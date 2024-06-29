import pickle

with open('./data_1_v2/all_result.pickle', 'rb') as handle:
    graph_data_all = pickle.load(handle)

with open('./data_1_v2/graph_info.pickle', 'rb') as handle:
    graph_info = pickle.load(handle)

print(graph_data_all)
# print(graph_info)