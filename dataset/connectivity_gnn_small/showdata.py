import pickle
import numpy as np

with open('data/data_1_v2/all_result.pickle', 'rb') as handle:
    all_result = pickle.load(handle)
    
# print(all_result[0]['node_res'])

avg_prob_list = []
for graph_idx in all_result.keys():
    avg_prob_list.append(np.mean(all_result[graph_idx]['node_res']).item())

print(avg_prob_list)
print("len(avg_prob_list): ", len(avg_prob_list))


sort_graph_idx = np.argsort(avg_prob_list)
print("sort the list: ", sort_graph_idx)

print("major earthquake grpah idx: ", sort_graph_idx[0])
print("moderate earthquake grpah idx: ", sort_graph_idx[int(len(sort_graph_idx)/2)])
print("minor earthquake grpah idx: ", sort_graph_idx[-1])
