import os
import json
import pickle
import logging
from flask import jsonify
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
import nltk


nltk.download('stopwords')
nltk.download('wordnet')

numberbatch = pickle.load(open("/data/zeste_cache/numberbatch-en-19.08-en.pickle", 'rb'))

print('Loading relations descriptions...')
relations = {}
relations_filepath = '/data/zeste_cache/relations_descriptions.txt'
if os.path.exists(relations_filepath):
    relations_file = open(relations_filepath, 'r')
    lines = relations_file.readlines()
    for line in lines:
        items = line.strip().split('\t')
        relations[items[0].strip()] = items[1].strip()

def preprocess(doc):
    lemmatizer = WordNetLemmatizer()

    doc = doc.replace("'ll", ' will').replace("s' ", 's').replace("'s", '').replace("-", '_')
    doc = ''.join(c for c in doc if c not in '!"#$%&\'()*+,./:;<=>?@[\\]^`{|}~')
    tokens = [w for w in doc.lower().split(' ') if w not in stopwords.words('english')]
    tokens = [lemmatizer.lemmatize(w) for w in tokens if w != '']

    return tokens


def get_word_neighborhood(word, depth=2, allowed_rels='all'):
    neighborhood = pickle.load(open('/data/zeste_cache/neighborhoods/'+word+'.pickle', 'rb'))
    neighborhood_words = list(neighborhood.keys())

    if allowed_rels != 'all':
        for n in neighborhood_words:
            if all(rel not in neighborhood[n]['rels'] for rel in allowed_rels):
                del neighborhood[n]

    to_visit_next = list(neighborhood.keys())
    while depth > 1:
        additions = []
        while len(to_visit_next) > 0:
            w = to_visit_next.pop()
            nn = get_word_neighborhood(w, depth=1, allowed_rels=allowed_rels)
            for ww in nn:
                if ww in neighborhood:
                    neighborhood[ww]['from'].append(w)
                    neighborhood[ww]['rels'].extend(['<>'] + nn[ww]['rels'])
                else:
                    neighborhood[ww] = {}
                    neighborhood[ww]['from'] = [w]
                    neighborhood[ww]['rels'] = nn[ww]['rels']
                    if word in numberbatch and ww in numberbatch:
                        neighborhood[ww]['sim'] = numberbatch.similarity(word, ww)
                    else:
                        neighborhood[ww]['sim'] = 0.0
                    additions.append(ww)
        to_visit_next = additions
        depth -= 1
    return neighborhood



def get_words_neighborhood(words, depth=2, allowed_rels=['isa', 'relatedto', 'synonym'], keep='top20000'):
    words = words.split('-')
    if words > 50:
        raise Exception('Too many topic labels')
    
    ns = []
    for word in words:
        ns.append(get_word_neighborhood(word, depth=depth))
    neighborhood = ns[0].copy()
    
    for w, nn in zip(words[1:], ns[1:]):
        for ww in nn:
            if ww in neighborhood:
                neighborhood[ww]['from'].append(w)
                neighborhood[ww]['rels'].extend(['<>'] + nn[ww]['rels'])
                neighborhood[ww]['sim'] = max(neighborhood[ww]['sim'], nn[ww]['sim'])
            else:
                neighborhood[ww] = {}
                neighborhood[ww]['from'] = [w]
                neighborhood[ww]['rels'] = nn[ww]['rels']
                neighborhood[ww]['sim']  = nn[ww]['sim']

    return neighborhood

def generate_label_neighborhoods(labels_list):
    label_neighborhoods = {}
    for label in labels_list:
        path = '/data/zeste_cache/demo_cache/'+label+'.pickle'
        if os.path.exists(path):
            logging.info('Loading cached neighborhood for the label "'+ label +'"')
            label_neighborhoods[label] = pickle.load(open(path, 'rb'))
        else:
            logging.info('Generating neighborhood for the label "'+ label +'"')
            label_neighborhoods[label] = get_words_neighborhood(label, depth=2, allowed_rels='all')
            pickle.dump(label_neighborhoods[label], open(path, 'wb'))
    return label_neighborhoods



def find_best_path(word, label, label_neighborhood):
    if word == label:
        return (word, 'is_label')

    if label in label_neighborhood[word]['from']:
        return (word, label_neighborhood[word]['rels'][-1], label)

    for ww in label_neighborhood[word]['from']:
        paths = []
        if label in label_neighborhood[ww]['from']:
            nw = pickle.load(open('/data/zeste_cache/neighborhoods/'+ww+'.pickle', 'rb'))
            if word in nw:
                return (word, nw[word]['rels'][-1], ww, label_neighborhood[ww]['rels'][-1], label)
            else:
                return  None


def get_document_score_and_explain(doc, labels, label_neighborhood):
    tokens = preprocess(doc)
    related_words = []
    score = 0
    for token in tokens:
        if token in label_neighborhood:
            similarity = label_neighborhood[token]['sim']
            if similarity > 0:
                related_words.append((token, similarity))
                score += similarity

    if '-' not in labels:
        labels = [labels]
    else:
        labels = labels.split('-')

    explanation = []
        
    for label in labels:
        for word, similarity in related_words:
            best_path = find_best_path(word, label, label_neighborhood)
            if best_path:
                explanation.append((best_path, similarity))
        explanation = list(set(explanation))

    return score, sorted(explanation, key=lambda t: -t[1])


def generate_json(explanation, doc, labels_neighborhoods):
    response = []
    tokens = preprocess(doc)
    for label in explanation:
        d = {'label': label, 'score': float(explanation[label][0]), 'terms':[]}

        for path, score in explanation[label][1]:
            if len(path) == 2:
                d['terms'].append({'paths':[[label, "label"]], 'score': float(score)})
            elif len(path) == 3:
                d['terms'].append({'paths':[[path[0], relations[path[1]], path[2]]], 'score': float(score)})
            elif len(path) == 5:
                d['terms'].append({'paths':[[path[0], relations[path[1]], path[2]], [path[2], relations[path[3]], path[4]]], 'score': float(score)})

                
        ln = labels_neighborhoods[label]
        d['highlights'] = [[t,str(-1 if t not in ln else ln[t]['sim'])] for t in tokens]
        
        response.append(d)
        
    total_scores = sum(label['score'] for label in response)
    for label in response:
        label['score'] /= total_scores if total_scores > 0 else 1.

    response = sorted(response, key=lambda l: -l['score'])
    return response


def predict(doc, labels_list):
    lns = generate_label_neighborhoods(labels_list)
    res = {}
    for label in lns:
        res[label] = get_document_score_and_explain(doc, label, lns[label])

    explanation_json = generate_json(res, doc, lns)
    return explanation_json