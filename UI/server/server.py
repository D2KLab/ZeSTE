from fast_autocomplete import AutoComplete
from flask import Flask, jsonify, request, Blueprint
from flask_cors import CORS, cross_origin
from zeste import predict
import os
import json
import trafilatura

import werkzeug
werkzeug.cached_property = werkzeug.utils.cached_property
from flask_restx import Resource, Api, fields
from werkzeug.middleware.proxy_fix import ProxyFix

print('Loading autocomplete vocabulary...')
words_en = {}
vocab_filepath = '/data/zeste_cache/vocab.txt'
if os.path.exists(vocab_filepath):
    vocab_file = open(vocab_filepath, 'r')
    lines = vocab_file.readlines()
    for line in lines:
        words_en[line.strip()] = {}
autocomplete_en = AutoComplete(words=words_en)

words_fr = {}
vocab_filepath = '/data/zeste_cache/vocab_fr.txt'
if os.path.exists(vocab_filepath):
    vocab_file = open(vocab_filepath, 'r')
    lines = vocab_file.readlines()
    for line in lines:
        words_fr[line.strip()] = {}
autocomplete_fr = AutoComplete(words=words_fr)

print('Starting web server...')
app = Flask(__name__)
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_port=1)
api = Api(app, doc='/doc')
cors = CORS(app)
ns = api.namespace('api', description='Topic Prediction API')

@ns.route('/status')
class status_route(Resource):
    def get(self):
        return 'OK'


@ns.route('/autocomplete', methods=['GET'])
@api.doc(params={'q': 'Search keywords', 'hl': 'Language'})
class autocomplete_route(Resource):
    @ns.doc('autocomplete_route')
    def get(self):
        q = request.args.get('q')
        hl = request.args.get('hl')
        if hl == 'en':
            autocomplete = autocomplete_en
        else:
            autocomplete = autocomplete_fr
        suggestions = autocomplete.search(word=q, max_cost=3, size=7)
        return jsonify(suggestions)

resource_fields = api.model('Resource', {
    'uri': fields.String,
    'text': fields.String,
    'labels': fields.String
})

@ns.route('/predict', methods=['POST'])
@api.doc(body=resource_fields)
class predict_route(Resource):
    @ns.doc('predict_route')
    def post(self):
        content = request.json
        print(content)

        language = content['language']
        show_explanations = 'explain' in content and content['explain']

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
        response = predict(text, labels, language, show_explanations)

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