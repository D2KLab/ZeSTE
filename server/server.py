from fast_autocomplete import AutoComplete
from flask import Flask, jsonify, request
from flask_cors import CORS, cross_origin
from zeste import predict
import os


def do_things_to_external_uri(uri):
    # To be done later
    pass


print('Loading autocomplete vocabulary...')
words = {}
vocab_filepath = '/data/zeste_cache/vocab.txt'
if os.path.exists(vocab_filepath):
    vocab_file = open(vocab_filepath, 'r')
    lines = vocab_file.readlines()
    for line in lines:
        words[line.strip()] = {}
autocomplete = AutoComplete(words=words)

print('Starting web server...')
app = Flask(__name__)
cors = CORS(app)

@app.route('/')
def hello_world():
    return 'Hello, World!'


@app.route('/autocomplete', methods=['GET'])
@cross_origin()
def autocomplete_route():
    q = request.args.get('q')
    suggestions = autocomplete.search(word=q, max_cost=3, size=7)
    return jsonify(suggestions)


@app.route('/predict', methods=['POST'])
@cross_origin()
def predict_route():
    content = request.json
    print(content)

    if 'uri' in content:
        text = do_things_to_external_uri(content['uri'])
    elif 'text' in content:
        text = content['text']

    # Process text with labels...
    labels = content['labels'].split(';')

    # Process text with labels
    response = predict(text, labels)

    ### response looks like this ###
    ### (both the labels and the paths are sorted by score ###
    # [{'label': 'space',
    #   'score': 1.2366091944277287,
    #   'terms': [{'paths': [['space', 'label']], 'score': 1.0},
    #    {'paths': [['star', 'locatedat', 'space']], 'score': 0.18517242},
    #    {'paths': [['love', 'isa', 'television_show'],
    #      ['television_show', 'isa', 'space']],
    #     'score': 0.05143677}]},
    #  {'label': 'technology',
    #   'score': 0.1451974897645414,
    #   'terms': [{'paths': [['space', 'relatedto', 'science_fiction'],
    #      ['science_fiction', 'relatedto', 'technology']],
    #     'score': 0.14295651},
    #    {'paths': [['love', 'relatedto', 'technophilia'],
    #      ['technophilia', 'relatedto', 'technology']],
    #     'score': 0.0022409796}]},
    #  {'label': 'medicine',
    #   'score': 0.05455923452973366,
    #   'terms': [{'paths': [['space', 'relatedto', 'science'],
    #      ['science', 'relatedto', 'medicine']],
    #     'score': 0.054559235}]}]

    # Return the output as a JSON string
    return jsonify(response)

if __name__ == '__main__':
    app.run(debug=True)