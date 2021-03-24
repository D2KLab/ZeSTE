from fast_autocomplete import AutoComplete
from flask import Flask, jsonify, request, Blueprint
from flask_cors import CORS, cross_origin
from zeste import predict
import os
import json
import trafilatura

import werkzeug
werkzeug.cached_property = werkzeug.utils.cached_property
from flask_restplus import Resource, Api


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
api = Api(app)
cors = CORS(app)
ns = api.namespace('', description='Topic Prediction API')

@ns.route('/status')
class status_route(Resource):
    def get(self):
        return 'OK'


@ns.route('/autocomplete', methods=['GET'])
@api.doc(params={'q': 'Search keywords'})
class autocomplete_route(Resource):
    @ns.doc('autocomplete_route')
    def get(self):
        q = request.args.get('q')
        suggestions = autocomplete.search(word=q, max_cost=3, size=7)
        return jsonify(suggestions)


@ns.route('/predict', methods=['POST'])
@api.doc(params={'uri': 'Page URI to extract text from and predict topics'})
@api.doc(params={'text': 'Text used to extract and predict topics'})
@api.doc(params={'labels': 'Labels separated by ";"'})
class predict_route(Resource):
    @ns.doc('predict_route')
    def post(self):
        content = request.json
        print(content)

        if 'uri' in content:
            downloaded = trafilatura.fetch_url(content['uri'])
            if downloaded is None:
                return jsonify({ "error": "Could not fetch URL" })
            text = trafilatura.extract(downloaded)
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
        return jsonify({
            "text": text,
            "labels": labels,
            "results": response
        })


@api.errorhandler
def default_error_handler(error):
    return {'error': str(error)}, getattr(error, 'code', 500)


if __name__ == '__main__':
    app.run(debug=True)