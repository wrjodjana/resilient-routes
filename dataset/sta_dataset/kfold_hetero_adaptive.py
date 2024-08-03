import argparse

import os
import pickle
from itertools import product
import time
import dgl
from dgl.data import DGLDataset
import dgl.function as fn
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import Subset
from sklearn.model_selection import train_test_split, KFold
from torch.utils.data import DataLoader, dataset
from torch.utils.data import ConcatDataset
from torch.autograd.functional import jacobian
from torch.optim.lr_scheduler import MultiStepLR
import networkx as nx
from modelzoo_hetero_od import *

parser = argparse.ArgumentParser()
parser.add_argument("--map_name", help="map_name", type=str)
parser.add_argument("--gpu", help="gpu", type=int, default = -1)

parser.add_argument("--train_data_dir_list", help="train_data_dir_list", type=str, nargs="+")
parser.add_argument("--test_data_dir_list", help="test_data_dir_list", type=str, nargs="+")
parser.add_argument("--train_num_sample_list", help="train_num_sample_list", type=int, nargs="+")
parser.add_argument("--test_num_sample_list", help="test_num_sample_list", type=int, nargs="+")

parser.add_argument("--model_idx", help="model_idx", type=int)
parser.add_argument("--small_sample", help="small_sample", type=float, default = 0.0)
parser.add_argument("--batch_size", help="batch_size", type=int, default = 64)
parser.add_argument("--epoch", help="epoch", type=int, default = 200)
parser.add_argument("--lr", help="lr", type=float, default = 0.001)
parser.add_argument("--loss", help="loss function", type=int, default = 1)
parser.add_argument("--conservation_loss", help="conservation_loss", type=int)

args = parser.parse_args()
train_num_sample_list = args.train_num_sample_list
test_num_sample_list = args.test_num_sample_list
train_data_dir_list = args.train_data_dir_list
test_data_dir_list = args.test_data_dir_list
map_name = args.map_name

# dgl.seed(234)
# torch.manual_seed(234)
# np.random.seed(234)
torch.set_printoptions(linewidth=200)

if args.gpu >= 0:
    device = 'cuda:{}'.format(args.gpu) if torch.cuda.is_available() else 'cpu'
else:
    device = 'cpu'
    
def collate(samples):
    n = len(samples)
    res_ratio = [samples[i].edges['connect'].data['res_ratio'] for i in range(n)]
    res_flow = [samples[i].edges['connect'].data['res_flow'] for i in range(n)]
    batched_graph = dgl.batch(samples)
    return batched_graph, torch.vstack((*res_ratio,)), torch.vstack((*res_flow,))

class TrafficAssignmentDataset(DGLDataset):
    def __init__(self, num_sample, data_dir, n_node, map_name):
        self.num_sample = num_sample
        self.data_dir = data_dir
        self.n_node = n_node
        self.map_name = map_name
        self.cap_ratio = {'Sioux':1000, 'EMA':1000, 'Anaheim':800, 'ANAHEIM':800}
        self.n_od = self.get_od_shape()
        super(TrafficAssignmentDataset, self).__init__(name='bridge', hash_key={num_sample, data_dir})
     
    def process(self):
        self.graphs = []
        
        coord_all = np.loadtxt('./{}/coord.csv'.format(map_name), delimiter=' ')
        coord = coord_all[:, 3:]
        
        # load data from imp folder
        for graph_id in range(self.num_sample):
            # load each graph
            with open(self.data_dir+'/data_{}.pickle'.format(graph_id), 'rb') as handle:
                graph_data = pickle.load(handle)
            # print(self.data_dir, graph_id)
            ratio, flow_list = [], []
            flow, capacity = graph_data['flow'], graph_data['capacity']
            for k1, k2 in zip(graph_data['ca_list'][:,0].squeeze(), graph_data['ca_list'][:,1].squeeze()):
                ratio.append([k1, k2, flow[(int(k1)), int(k2)]/capacity[(int(k1)), int(k2)] ])
                flow_list.append([k1, k2, flow[(int(k1)), int(k2)]])
            ratio = np.vstack(ratio)
            flow_list = np.vstack(flow_list)
            
            assert(np.array_equal(ratio[:, 0].squeeze(), graph_data['ca_list'][:, 0].squeeze()))
            assert(np.array_equal(ratio[:, 1].squeeze(), graph_data['ca_list'][:, 1].squeeze()))
            
            
            # data is directed, make it undirected
            src_ncn = torch.tensor(graph_data['ca_list'][:,0].squeeze(), dtype=torch.int32)
            dst_ncn = torch.tensor(graph_data['ca_list'][:,1].squeeze(), dtype=torch.int32)
            
            ## now nodn only connect edge that od > 0 --> considering add edge feature in the future
            src_nodn = torch.tensor(graph_data['od_list'][:,0].squeeze(), dtype=torch.int32)
            dst_nodn = torch.tensor(graph_data['od_list'][:,1].squeeze(), dtype=torch.int32)
            
            hetergraph_data = {
                ('node', 'connect', 'node'): (src_ncn, dst_ncn),
                ('node', 'od', 'node'): (src_nodn, dst_nodn)
            }
            g = dgl.heterograph(hetergraph_data)

            # considier OD as node feature
            od_node_feat = torch.tensor(graph_data['demand_matrix'], dtype=torch.float32)
            coord_feat = torch.tensor(coord, dtype=torch.float32)
            connect_edge_feat = torch.tensor(graph_data['ca_list'][:, 2:], dtype=torch.float32)
            connect_edge_res_ratio = torch.tensor(ratio[:, 2:], dtype=torch.float32)
            connect_edge_res_flow = torch.tensor(flow_list[:, 2:], dtype=torch.float32)
            
            g.nodes['node'].data['feat'] = od_node_feat / 1e3 # od vector
            g.nodes['node'].data['feat_T'] = od_node_feat.T / 1e3
            g.nodes['node'].data['coord'] = coord_feat
            g.edges['connect'].data['feat'] = connect_edge_feat # feature
            # print(torch.mean(g.edges['connect'].data['feat'], dim=0))
            if 'Sioux' in map_name:
                g.edges['connect'].data['feat'] = g.edges['connect'].data['feat'] - torch.tensor([14.6331,  2.4053])
                g.edges['connect'].data['feat'][:, 0] = g.edges['connect'].data['feat'][:, 0] / 10.0
            if 'EMA' in map_name:
                g.edges['connect'].data['feat'] = g.edges['connect'].data['feat'] - torch.tensor([2.8800, 0.1721])
                g.edges['connect'].data['feat'][:, 0] = g.edges['connect'].data['feat'][:, 0] / 5.0
            if 'ANAHEIM' in map_name:
                g.edges['connect'].data['feat'] = g.edges['connect'].data['feat'] - torch.tensor([5.0934, 0.7848])
                g.edges['connect'].data['feat'][:, 0] = g.edges['connect'].data['feat'][:, 0] / 5.0

            g.edges['connect'].data['capacity'] = connect_edge_feat[:, 0:1]*self.cap_ratio[map_name] # capacity
            g.edges['connect'].data['res_ratio'] = connect_edge_res_ratio # result_ratio
            g.edges['connect'].data['res_flow'] = connect_edge_res_flow # result_flow

            self.graphs.append(g)

    def get_od_shape(self):
        with open(self.data_dir+'/data_0.pickle', 'rb') as handle:
            graph_data = pickle.load(handle)
        od_link = graph_data['od_list']
        # od_link = torch.nonzero(torch.sum(od_feat, dim=2))
        
        return od_link.shape[0]
    
    def __getitem__(self, i):
        return self.graphs[i]

    def __len__(self):
        return len(self.graphs)

def train(train_dataloader, test_dataloader, model, args, fold_idx):
    time_total = 0
    min_test_loss = 1e9
    optimizer = torch.optim.Adam(model.parameters(), lr=args.lr)
    scheduler = MultiStepLR(optimizer, milestones=[100], gamma=0.2)
    
    train_loss_list, train_residue_list, test_loss_list, test_residue_list = [], [], [], []
    for e in range(args.epoch):
        t0 = time.time()
        model.train()
        train_loss, train_residue = [], []
        for _, (g, edge_ratio, edge_flow) in enumerate(train_dataloader):
            g = g.to(device)
            edge_ratio = edge_ratio.to(device)
            edge_flow = edge_flow.to(device)
            
            node_feat = g.nodes['node'].data['feat']
            edge_feat = g.edges['connect'].data['feat']

            
            # ratio
            pred_ratio = model(g, node_feat, edge_feat)
            # flow
            pred_flow = pred_ratio * g.edges['connect'].data['capacity']
            
            # normal loss
            if args.loss == 1:
                loss = torch.mean(torch.abs(pred_ratio - edge_ratio)) + torch.mean(torch.abs(pred_flow - edge_flow))*0.005
            if args.loss == 2:
                loss = torch.mean((edge_ratio + 1.0)*torch.abs(pred_ratio - edge_ratio))
                
            train_loss.append(torch.mean(torch.abs(pred_ratio - edge_ratio)).detach().cpu().numpy())
            
            if args.conservation_loss:
                # conservation loss
                g.edges['connect'].data['flow'] = pred_ratio * g.edges['connect'].data['feat'][:, 0:1]
                rg = dgl.reverse(g, copy_ndata=False, copy_edata=True)
                
                g['connect'].update_all(fn.copy_e('flow', 'm'), fn.sum('m', 'in_flow'), etype='connect')
                rg['connect'].update_all(fn.copy_e('flow', 'm'), fn.sum('m', 'out_flow'), etype='connect')
                
                # out_flow - inflow = out_demand (sum(X[0, :])) - in_demand(sum(X[:, 0]))
                residue = rg.nodes['node'].data['out_flow'] - g.nodes['node'].data['in_flow'] - \
                    (torch.sum(g.nodes['node'].data['feat'], dim=1).view(-1, 1) - \
                    torch.sum(g.nodes['node'].data['feat_T'], dim=1).view(-1, 1))

                if args.conservation_loss:  loss += 0.05*torch.mean(torch.abs(residue))
                train_residue.append(torch.mean(torch.abs(residue)).detach().cpu().numpy())
            
            # Backward
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()

        # save training history
        train_loss_list.append(np.mean(np.hstack(train_loss)))
        if args.conservation_loss:  train_residue_list.append(np.mean(np.hstack(train_residue)))
        
        time_total += time.time() - t0
        
        if e % 5 == 0:
            test_loss, test_residue = [], []
            model.eval()
            for _, (g, edge_ratio, edge_flow) in enumerate(test_dataloader):
                g = g.to(device)
                edge_ratio = edge_ratio.to(device)
                edge_flow = edge_flow.to(device)

                node_feat = g.nodes['node'].data['feat']
                edge_feat = g.edges['connect'].data['feat']

                # Forward
                pred_ratio = model(g, node_feat, edge_feat)
                
                # normal loss
                l = torch.mean(torch.abs(pred_ratio - edge_ratio))
                test_loss.append(torch.mean(torch.abs(pred_ratio - edge_ratio)).detach().cpu().numpy())
                
                # conservation loss
                g.edges['connect'].data['flow'] = pred_ratio * g.edges['connect'].data['feat'][:, 0:1]
                rg = dgl.reverse(g, copy_ndata=False, copy_edata=True)
                
                g['connect'].update_all(fn.copy_e('flow', 'm'), fn.sum('m', 'in_flow'), etype='connect')
                rg['connect'].update_all(fn.copy_e('flow', 'm'), fn.sum('m', 'out_flow'), etype='connect')
                
                # out_flow - inflow = out_demand (sum(X[0, :])) - in_demand(sum(X[:, 0]))
                res_test = rg.nodes['node'].data['out_flow'] - g.nodes['node'].data['in_flow'] - \
                    (torch.sum(g.nodes['node'].data['feat'], dim=1).view(-1, 1) - \
                    torch.sum(g.nodes['node'].data['feat_T'], dim=1).view(-1, 1))
                test_residue.append(torch.mean(torch.abs(res_test)).detach().cpu().numpy())

                # Compute accuracy on training/validation/test
                test_loss.append(l.cpu().detach().numpy().item())
            
            if np.mean(np.array(test_loss)) < min_test_loss:
                min_test_loss = np.mean(np.array(test_loss))
                torch.save(model.state_dict(), 'kfold_model_revision/{}_{}_{}_{}.pth'.format(
                    ' '.join(args.train_data_dir_list), ' '.join(args.test_data_dir_list), args.model_idx, fold_idx))
            print('In epoch {}, train_loss: {:.3f}, test_loss: {:.3f}, residue_test: {:.3f}'.format(e, \
                loss, np.mean(np.array(test_loss)), torch.mean(torch.abs(res_test))))
        
        # save testing history
        test_loss_list.append(np.mean(np.hstack(test_loss)))
        if args.conservation_loss:  test_residue_list.append(np.mean(np.hstack(test_residue)))
        
    # save result in pickle
    # gt, pred
    all_gt, all_pred, all_conservation, all_OD = [], [], [], []
    all_gt_flow, all_pred_flow = [], []
    model.eval()
    for _, (g, edge_ratio, edge_flow) in enumerate(test_dataloader):
        g = g.to(device)
        edge_ratio = edge_ratio.to(device)
        edge_flow = edge_flow.to(device)
        
        node_feat = g.nodes['node'].data['feat']
        edge_feat = g.edges['connect'].data['feat']

        # Forward
        pred_ratio = model(g, node_feat, edge_feat)
        pred_flow = pred_ratio * g.edges['connect'].data['feat'][:, 0:1]
        
        # conservation loss
        g.edges['connect'].data['flow'] = pred_ratio * g.edges['connect'].data['feat'][:, 0:1]
        rg = dgl.reverse(g, copy_ndata=False, copy_edata=True)
        
        g['connect'].update_all(fn.copy_e('flow', 'm'), fn.sum('m', 'in_flow'), etype='connect')
        rg['connect'].update_all(fn.copy_e('flow', 'm'), fn.sum('m', 'out_flow'), etype='connect')
        
        res_test = rg.nodes['node'].data['out_flow'] - g.nodes['node'].data['in_flow'] - \
            (torch.sum(g.nodes['node'].data['feat'], dim=1).view(-1, 1) - \
            torch.sum(g.nodes['node'].data['feat_T'], dim=1).view(-1, 1))
        
        all_gt.append(edge_ratio.detach().cpu().numpy())
        all_pred.append(pred_ratio.detach().cpu().numpy())
        
        all_gt_flow.append(edge_flow.detach().cpu().numpy())
        all_pred_flow.append(pred_flow.detach().cpu().numpy())
        
        all_conservation.append(res_test.detach().cpu().numpy())
        all_OD.append(g.nodes['node'].data['feat'].detach().cpu().numpy().sum(axis=1).reshape(-1, 1))
        # print(edge_ratio[:5, :].T)
        # print(edge_flow[:5, :].T)
        # print(pred_ratio[:5, :].T)
        # print(pred_flow[:5, :].T)
        # print(res_test[:5, :].T)
        # print(g.edges['connect'].data['feat'][:5, 0:1].T)
        
    result = dict()
    all_gt = np.vstack(all_gt)
    all_pred = np.vstack(all_pred)
    all_gt_flow = np.vstack(all_gt_flow)
    all_pred_flow = np.vstack(all_pred_flow)
    result['train_loss_list'] = np.vstack(train_loss_list)
    if args.conservation_loss:  result['train_residue_list'] = np.vstack(train_residue_list)
    result['test_loss_list'] = np.vstack(test_loss_list)
    if args.conservation_loss:  result['test_residue_list'] = np.vstack(test_residue_list)
    
    
    result['all_conservation'] = np.vstack(all_conservation)
    result['all_res'] = np.column_stack((all_gt, all_pred)) # gt, pred
    result['all_res_flow'] = np.column_stack((all_gt_flow, all_pred_flow)) # gt, pred
    result['all_OD'] = np.vstack(all_OD)
    result['args'] = args
    result['time'] = time_total
    result['min_test_loss'] = min_test_loss
    with open('./kfold_result_revision/{}_{}_{}_{}.pickle'.format(
        ' '.join(args.train_data_dir_list), ' '.join(args.test_data_dir_list), args.model_idx, fold_idx), 'wb') as handle:
        pickle.dump(result, handle)
    
if 'Sioux' in map_name:
    n_node = 24
    map_name = 'Sioux'
if 'EMA' in map_name:
    n_node = 74
    map_name = 'EMA'
if 'Anaheim' in map_name:
    n_node = 416
    map_name = 'Anaheim'
if 'ANAHEIM' in map_name:
    n_node = 416
    map_name = 'ANAHEIM'
    
train_data_dir_list.sort()
test_data_dir_list.sort()

if train_data_dir_list == test_data_dir_list:
    all_data_batch = []
    for train_num_sample, train_data_dir in zip(train_num_sample_list, train_data_dir_list):
        train_dataset = TrafficAssignmentDataset(train_num_sample, train_data_dir, n_node, map_name)
        all_data_batch.append(train_dataset)

    data_batch = ConcatDataset(all_data_batch)

    kf = KFold(n_splits=5, shuffle=True, random_state=42)
    for fold_idx, (train_index, test_index) in enumerate(kf.split(data_batch)):
        print(f"Fold {fold_idx}:")
        print(f"  Train: index={train_index}")
        print(f"  Test:  index={test_index}")

        train_batch = Subset(data_batch, train_index)
        test_batch = Subset(data_batch, test_index)
        
        train_dataloader = DataLoader(train_batch, batch_size=args.batch_size, shuffle=True, collate_fn=collate, num_workers=8)
        test_dataloader = DataLoader(test_batch, batch_size=args.batch_size, shuffle=True, collate_fn=collate, num_workers=8)
        
        if args.model_idx == 16: model = TransformerModel_Hetero5(in_feats=n_node, h_feats=32, num_head=4, n_od=train_dataset.n_od, batch_size=args.batch_size).to(device)
        if args.model_idx == 17: model = TransformerModel_Hetero5(in_feats=n_node, h_feats=32, num_head=4, n_od=train_dataset.n_od, batch_size=args.batch_size).to(device)

        
        # Create the model. The output has three pred_ratio for three classes.
        train(train_dataloader, test_dataloader, model, args, fold_idx)
else:
    all_train_batch, all_test_batch = [], []
    for train_num_sample, train_data_dir in zip(train_num_sample_list, train_data_dir_list):
        train_dataset = TrafficAssignmentDataset(train_num_sample, train_data_dir, n_node, map_name)
        all_train_batch.append(train_dataset)
        
    for test_num_sample, test_data_dir in zip(test_num_sample_list, test_data_dir_list):
        test_dataset = TrafficAssignmentDataset(test_num_sample, test_data_dir, n_node, map_name)
        all_test_batch.append(test_dataset)

    train_batch = ConcatDataset(all_train_batch)
    test_batch = ConcatDataset(all_test_batch)

    
    kf = KFold(n_splits=5, shuffle=True, random_state=42)
    for fold_idx, (train_index, test_index) in enumerate(kf.split(train_batch)):
        print(f"Fold {fold_idx}:")
        print(f"  Train: index={train_index}")
        print(f"  Test:  index={test_index}")

        train_batch_subset = Subset(train_batch, train_index)
        test_batch_subset = Subset(test_batch, test_index)
        
        train_dataloader = DataLoader(train_batch_subset, batch_size=args.batch_size, shuffle=True, collate_fn=collate, num_workers=8)
        test_dataloader = DataLoader(test_batch_subset, batch_size=args.batch_size, shuffle=True, collate_fn=collate, num_workers=8)
        
        if args.model_idx == 16: model = TransformerModel_Hetero5(in_feats=n_node, h_feats=32, num_head=4, n_od=test_dataset.n_od, batch_size=args.batch_size).to(device)
        if args.model_idx == 17: model = TransformerModel_Hetero5(in_feats=n_node, h_feats=32, num_head=4, n_od=test_dataset.n_od, batch_size=args.batch_size).to(device)
        

        # Create the model. The output has three pred_ratio for three classes.
        train(train_dataloader, test_dataloader, model, args, fold_idx)
