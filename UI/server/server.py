from fast_autocomplete import AutoComplete
from flask import Flask, jsonify, request, Blueprint
from flask_cors import CORS, cross_origin
from zeste import predict
import argparse
import os
import logging
import trafilatura

import werkzeug
werkzeug.cached_property = werkzeug.utils.cached_property
from flask_restx import Resource, Api, fields
from werkzeug.middleware.proxy_fix import ProxyFix


parser = argparse.ArgumentParser(description='ZeSTE server')
parser.add_argument('--disallowed-rels', help='List of semicolon-separated relations that are disallowed', default='')
parser.add_argument('-v', '--verbose', help='increase output verbosity', action='store_true')
args = parser.parse_args()
if args.verbose:
    logging.basicConfig(level=logging.DEBUG)
logging.debug('Args:', args)

logging.info('Loading autocomplete vocabulary...')
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

logging.info('Starting web server...')
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
    'uri': fields.String(description='The URL to a page to extract text and return predictions for (if specified, `text` will be ignored)'),
    'text': fields.String(description='The text to extract (if `uri` is specified, this will be ignored)'),
    'language': fields.String(description='language of the text to extract (en, fr)', required=True),
    'labels': fields.String(description='semicolon-separated list of labels', required=True),
    'disallowed_rels': fields.List(fields.String, description='list of relations to ignore', default=[]),
    'explain': fields.Boolean(description='return explanations for each prediction', default=False),
    'highlights': fields.Boolean(description='return highlights for each prediction', default=True)
})

@ns.route('/predict', methods=['POST'])
@api.doc(body=resource_fields)
class predict_route(Resource):
    @ns.doc('predict_route')
    def post(self):
        content = request.json
        logging.debug(content)

        language = content['language']
        show_explanations = 'explain' in content and content['explain']
        show_highlights = 'highlights' in content and content['highlights']
        disallowed_rels = content['disallowed_rels'] if 'disallowed_rels' in content else args.disallowed_rels.split(';')

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
        response = predict(text, labels, language, disallowed_rels, show_explanations, show_highlights)

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
    app.run(host=os.getenv('FLASK_RUN_HOST'), port=os.getenv('FLASK_RUN_PORT'), debug=os.getenv('FLASK_DEBUG') == 'development')