import os
import pickle
import argparse
import pandas as pd
from tqdm import tqdm
from pprint import pprint
import gensim.downloader as api
from gensim.models import KeyedVectors

###
#   Parsing Arguments
###

parser = argparse.ArgumentParser(description='Zero-Shot Topic Extraction')

parser.add_argument("-cnp", "--conceptnet_assertions_path", type=str, help="Path to CSV file containing ConceptNet assertions dump", default='conceptnet-assertions-5.7.0.csv')
parser.add_argument("-nbp", "--conceptnet_numberbatch_path", type=str, help="Path to W2V file for ConceptNet Numberbatch",  default='numberbatch-en-19.08.txt')
parser.add_argument("-zcp", "--zeste_cache_path", type=str, help="Path to the repository where the generated files will be saved", default='zeste_cache/')

args = parser.parse_args()


###
#   Loading & Preprocessing Data
###

# wget https://s3.amazonaws.com/conceptnet/downloads/2019/edges/conceptnet-assertions-5.7.0.csv.gz
# gzip -d conceptnet-assertions-5.7.0.csv.gz
# wc -l conceptnet-assertions-5.7.0.csv
# wget https://conceptnet.s3.amazonaws.com/downloads/2019/numberbatch/numberbatch-19.08.txt.gz


if not os.path.exists(args.zeste_cache_path):
    print('Caching folder (', args.zeste_cache_path,') not found.. creating it now.')
    os.mkdir(args.zeste_cache_path)


data = []
print('Reading ConceptNet assertions..')
with open(args.conceptnet_assertions_path, 'r') as f:
    for line in f:
        triplet, rel, sub, obj, info = line.split('\t')
        data.append((sub, rel, obj))
        # if len(data) == 30000: break

cn = pd.DataFrame(data=data, columns=['subject', 'relation', 'object'])
# cn.to_csv('conceptnet_5.7.0.csv')

print('Loading ConceptNet assertions..')
data_en = []
for i, triplet in tqdm(cn.iterrows(), total=len(cn)):
    lang = triplet.subject.split('/')[2]
    if lang == 'en':
        sub = triplet.subject.split('/')[3]
        obj = triplet.object.split('/')[3]
        rel = '/'.join([w.lower() for w in triplet.relation.split('/')[2:]])
        data_en.append((sub, rel, obj))

# cn_en = pd.DataFrame(data=data_en, columns=['subject', 'relation', 'object'])

print('Loading Numberbatch embeddings (may take some time)..')
numberbatch = KeyedVectors.load_word2vec_format(args.conceptnet_numberbatch_path)

pickle.dump(numberbatch, open(os.path.join(args.zeste_cache_path, args.conceptnet_numberbatch_path.split('/')[-1].replace('txt', '') +'.pickle'), 'wb'))
print('Saving the pickled Numberbatch into', os.path.join(args.zeste_cache_path, args.conceptnet_numberbatch_path.split('/')[-1]+'.pickle'))

reverse_rels = { 'antonym': 'antonym',
                 'atlocation': 'locatedat',
                 'capableof': 'doableby',
                 'causes': 'iscausedby',
                 'causesdesire': 'desires',
                 'createdby': 'created',
                 'definedas': 'isdefinionof',
                 'derivedfrom': 'derives',
                 'desires': 'causesdesire',
                 'distinctfrom': 'distinctfrom',
                 'entails': 'requires',
                 'etymologicallyderivedfrom': 'etymologicallyderiving',
                 'etymologicallyrelatedto': 'etymologicallyrelatedto',
                 'formof': 'originalformof',
                 'hasa': 'ispartof',
                 'hascontext': 'incontextof',
                 'hasfirstsubevent': 'isfirstsubevent',
                 'haslastsubevent': 'islastsubeventof',
                 'hasprerequisite': 'isprequisite',
                 'hasproperty': 'ispropertyof',
                 'hassubevent': 'issubeventfor',
                 'instanceof': 'type',
                 'isa': 'isa',
                 'locatednear': 'locatednear',
                 'madeof': 'ismatterof',
                 'mannerof': 'ofmanner',
                 'motivatedbygoal': 'motivates',
                 'notcapableof': 'isimpossiblefor',
                 'notdesires': 'notdesiredby',
                 'nothasproperty': 'notpropertyof',
                 'partof': 'hasa',
                 'receivesaction': 'actson',
                 'relatedto': 'relatedto',
                 'similarto': 'similarto',
                 'symbolof': 'symbolizedby',
                 'synonym': 'synonym',
                 'usedfor': 'uses',
                 'dbpedia/capital': 'dbpedia/capital',
                 'dbpedia/field': 'dbpedia/field',
                 'dbpedia/genre': 'dbpedia/genre',
                 'dbpedia/genus': 'dbpedia/genus',
                 'dbpedia/influencedby': 'dbpedia/influencedby',
                 'dbpedia/knownfor': 'dbpedia/knownfor',
                 'dbpedia/language': 'dbpedia/language',
                 'dbpedia/leader': 'dbpedia/leader',
                 'dbpedia/occupation': 'dbpedia/occupation',
                 'dbpedia/product': 'dbpedia/product'}

data_rev = set()

print('Adding reverse relations to the graph if absent..')
for s, r, o in tqdm(data_en):
    if r == 'externalurl':
        continue
    data_rev.add((s, r, o))
    data_rev.add((o, reverse_rels[r], s))

cn_en_all = pd.DataFrame(data=sorted(data_rev, key=lambda x: x[0]), columns=['subject', 'relation', 'object'])
current = '0'
neighbors = {current: {'rels':['sameas'], 'sim': 1., 'from': [current]}}

for i, e in tqdm(cn_en_all.iterrows(), total=len(cn_en_all)):
    s, r, o = e['subject'], e['relation'], e['object']
    assert(type(s) == str and type(s) == str)
    if s != current:
        try:
            pickle.dump(neighbors, open(os.path.join(args.zeste_cache_path, current+'.pickle'), 'wb'))
        except Exception as e:
            print(f'Exception at word "{current}":', str(e))
        # print(current, "'s neighborhood:")
        # pprint(neighbors)
        current = s
        neighbors = {current: {'rels':['sameas'], 'sim': 1., 'from': [current]}}

    if o not in neighbors: # adding a new neighbor to the neighborhood
        neighbors[o] = {'rels':[r], 'sim': 0., 'from': [s]}
        if s in numberbatch and o in numberbatch:
            neighbors[o]['sim'] = numberbatch.similarity(s, o)
    else: # already encountered this neighnor from a previous relation
        neighbors[o]['rels'].append(r)