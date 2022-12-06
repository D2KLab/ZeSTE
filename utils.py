import os
import time
import copy
import pickle
import itertools
import numpy as np
import pandas as pd

import multiprocessing as mp
import matplotlib.pyplot as plt

from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score

def get_word_neighborhood(label, depth, numberbatch, cache_path, prefetch_path, save_to_prefetch = True):
    # In case the requested label does not appear in the cache

    pickle_path = os.path.join(cache_path, label+'.pickle')
    if depth == 0 or not os.path.exists(pickle_path) or label not in numberbatch:
        return {}

    # if already computed
    if depth > 1:
        prefetch_folder = os.path.join(prefetch_path, str(depth))
        if not os.path.exists(prefetch_folder):
            print('Creating folder:', prefetch_folder)
            os.makedirs(prefetch_folder, exist_ok=True)
        prefetch_pickle_path = os.path.join(prefetch_folder, label+'.pickle')
        if os.path.exists(prefetch_pickle_path):
            return pickle.load(open(prefetch_pickle_path, 'rb'))

    # Get immediate label neighborhood
    similarities = ['simple', 'compound', 'depth', 'harmonized']
    neighborhood = pickle.load(open(pickle_path, 'rb'))
    for node in neighborhood:
        # we add the possiblity of defining multiple similarity methods for nodes that are not directly connected
        # to the Label node
        neighborhood[node]['rels'] = [tuple(neighborhood[node]['rels'])]
        neighborhood[node]['sim'] = {sim:neighborhood[node]['sim'] for sim in similarities}

    # Connect to n-hops labels
    hops = 1
    to_visit_next = list(neighborhood.keys())
    while hops < depth:
        next_hop = []
        while len(to_visit_next) > 0:
            current_node = to_visit_next.pop()
            if current_node in stopwords.words('english'):
                continue
            if neighborhood[current_node]['sim']['simple'] <= 0:
                continue
            cnn = get_word_neighborhood(current_node, 1, numberbatch, cache_path, prefetch_path)
            for word in cnn:
                if word not in neighborhood:
                    neighborhood[word] = {'from':[], 'rels': [], 'sim':{}}
                    sim_dict = {sim: 0.0 for sim in similarities}
                else:
                    sim_dict = neighborhood[word]['sim']

                neighborhood[word]['from'].append(current_node)
                neighborhood[word]['rels'].append(tuple(cnn[word]['rels']))
                if word in numberbatch:
                    sim_label_word = numberbatch.similarity(label, word)
                    sim_dict['simple'] = max(sim_dict['simple'], sim_label_word)
                    sim_dict['depth']  = max(sim_dict['depth'], sim_label_word / (hops + 1))
                    if current_node in numberbatch:
                        sim_cn_word = numberbatch.similarity(current_node, word)
                        sim_label_cn = numberbatch.similarity(label, current_node)
                        compound = sim_label_cn * sim_cn_word
                        harmonized = 2*compound / (sim_label_cn + sim_cn_word)
                        sim_dict['compound'] = max(sim_dict['compound'], compound)
                        sim_dict['harmonized'] = max(sim_dict['harmonized'], harmonized)
                    else:
                        sim_dict['compound'] = max(sim_dict['compound'], sim_label_word)
                        sim_dict['harmonized'] = max(sim_dict['harmonized'], sim_label_word)

                # print('From label' + label + '- current node:' + current_node + ', word:' + word)
                neighborhood[word]['sim'] = sim_dict
                next_hop.append(word)

        hops += 1
        to_visit_next = next_hop

    # save
    if depth > 1 and save_to_prefetch:
        pickle.dump(neighborhood, open(prefetch_pickle_path, 'wb'))

    return neighborhood

def get_label_neighborhood(label_words, depth, numberbatch, cache_path, prefetch_path):

    ns = []
    words = label_words.split(';')
    for word in words:
        ns.append(get_word_neighborhood(word, depth, numberbatch, cache_path, prefetch_path))
    neighborhood = ns[0].copy()

    for current_node, cnn in zip(words[1:], ns[1:]):
        for word in cnn:
            if word in neighborhood:
                neighborhood[word]['from'].append(current_node)
                neighborhood[word]['rels'].append(tuple(cnn[word]['rels']))
                neighborhood[word]['sim'] = {s:max(neighborhood[word]['sim'][s], cnn[word]['sim'][s]) for s in cnn[word]['sim']}
            else:
                neighborhood[word] = {}
                neighborhood[word]['from'] = [current_node]
                neighborhood[word]['rels'] = [tuple(cnn[word]['rels'])]
                neighborhood[word]['sim']  = cnn[word]['sim'].copy()

    return neighborhood


def filter_neighborhoood(neighborhood_original, allowed_rels, sim, keep):
    if allowed_rels == 'all' and sim == 'simple' and keep == 'all':
        return neighborhood_original

    neighborhood = copy.deepcopy(neighborhood_original)

    if allowed_rels == 'related':
        allowed_rels = ['DefinedAs', 'DerivedFrom', 'HasA', 'InstanceOf', 'IsA', 'PartOf', 'RelatedTo', 'SimilarTo', 'Synonym', 'Antonym']

    if ',' in allowed_rels:
        allowed_rels = allowed_rels.split(',')

    if allowed_rels != 'all':
        nodes = list(neighborhood.keys())
        for node in nodes:
            if not any(rel in rels[0] for rel in allowed_rels for rels in neighborhood[node]['rels']):
                del neighborhood[node]
                continue

    if keep != 'all':
        all_scores = sorted([neighborhood[node]['sim'][sim] for node in neighborhood], reverse=True)
        if keep.startswith('top') and keep.endswith('%'):
            keep = int(keep[3:-1]) / 100.
            cutoff_score = all_scores[int(keep*(len(all_scores)))-1]
        elif keep.startswith('top'):
            keep = int(keep[3:])
            cutoff_score = all_scores[min(len(all_scores)-1,keep)]
        elif keep.startswith('thresh'):
            cutoff_score = float(keep[6:])
        nodes = list(neighborhood.keys())
        for node in nodes:
            node_sim = neighborhood[node]['sim'][sim]
            if node_sim <= cutoff_score:
                del neighborhood[node]
                continue

    return neighborhood


lemmatizer = WordNetLemmatizer()
def preprocess(document):
    document = document.replace("'ll", ' will').replace("s' ", 's').replace("'s", '').replace("-", '_')
    document = ''.join(c for c in document if c not in '!"#$%&\'()*+,./:;<=>?@[\\]^`{|}~')
    document = [w for w in document.lower().split(' ') if w not in stopwords.words('english')]
    document = [lemmatizer.lemmatize(w) for w in document if w != '']
    return document


def score(tokens, label_neighborhood, sim, ngrams, normalize):
    if ngrams:
        doc = ' '.join(tokens)
        for ngram in ngrams:
            if ngram in doc:
                tokens.append(ngram)
    score = 0
    inter = 0
    for token in tokens:
        if token in label_neighborhood:
            score += label_neighborhood[token]['sim'][sim]
            inter += 1

    if normalize == 'inter_len':
        score = score / max(inter, 1)
    elif normalize == 'max_score':
        score = score / sum([label_neighborhood[node]['sim'][sim] for node in label_neighborhood])

    return round(score, 6)


def predict_dataset(docs, sorted_labels, labels_neighborhoods, sim, ngrams, normalize='max_score'):
    scores = np.zeros((len(docs), len(sorted_labels)))
    for i, doc in enumerate(docs):
        for j, label in enumerate(sorted_labels):
            scores[i][j] = score(doc, labels_neighborhoods[label], sim, ngrams, normalize)
    return scores


def evaluate(predicted_labels, gt_labels, labels_mapping):
    if type(gt_labels[0]) == list:
        for i, p in enumerate(predicted_labels):
            corrert_labels = [labels_mapping[l] for l in gt_labels[i]]
            if p in corrert_labels:
                gt_labels[i] = p
            else:
                gt_labels[i] = corrert_labels[0]
    else:
        gt_labels = [labels_mapping[l] for l in gt_labels]


    acc = accuracy_score(predicted_labels, gt_labels)
    pre = precision_score(predicted_labels, gt_labels, average='weighted')
    rec = recall_score(predicted_labels, gt_labels, average='weighted')
    f1  = f1_score(predicted_labels, gt_labels, average='weighted')
    cm  = confusion_matrix(predicted_labels, gt_labels)

    cr  = classification_report(predicted_labels, gt_labels)
    return acc, pre, rec, f1, cm, cr