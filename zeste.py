import argparse
from tqdm import tqdm
import multiprocessing as mp
import nltk

from utils import *

if __name__ == "__main__":
    ###
    #   Parsing Arguments
    ###

    parser = argparse.ArgumentParser(description='Zero-Shot Topic Extraction')

    parser.add_argument("-cp", "--cache_path", type=str, help="Path to where the 1-hop word neighborhoods are cached",
                        default='zeste_cache', required=True)
    parser.add_argument('-pp', '--prefetch_path', type=str, help="Path to where the precomputed n-hop neighborhoods are cached",
                        required=True)
    parser.add_argument('-nb', '--numberbatch_path', type=str, help="Path to the pickled Numberbatch",
                        default='numberbatch-en-19.08.pickle')
    parser.add_argument('-dp', '--dataset_path', type=str, help="Path to the dataset to process",
                        default='data/bbc_dataset.csv')
    parser.add_argument('-lm', '--labels_mapping', type=str, help="Path to the mapping between the dataset labels and ZeSTE labels (multiword labels are comma-separated)",
                        default='labels_mapping/bbc_labels_mapping.txt')
    parser.add_argument('-rp', '--results_path', type=str, help="Path to the directory where to store the results",
                        required=True)
    parser.add_argument('-d', '--depth', type=int, help="How many hops to generate the neighborhoods", default=2)
    parser.add_argument('-f', '--filter', type=str, help="Filtering method: 'top[N]', 'top[P]%'', 'thresh[T]', 'all'", default='all')
    parser.add_argument('-s', '--similarity', type=str, choices=['simple', 'compound', 'depth', 'harmonized'], default='simple')
    parser.add_argument('-n', '--use_ngrams', type=bool, default=False, help='Whether or not to use n-grams (vs only simple wprds)')
    parser.add_argument('-ar', '--allowed_rels', type=str, help="Which relationships to use (comma-separated or 'all')", default='all')

    args = parser.parse_args()

    print('Loading nltk..')
    nltk.download('stopwords')
    nltk.download('wordnet')
    nltk.download('omw-1.4')

    ###
    #   Loading & Preprocessing Data
    ###

    print('Laading numberbatch..')
    numberbatch = pickle.load(open(args.numberbatch_path, 'rb'))

    df_dataset = pd.read_csv(args.dataset_path)
    raw_corpus = df_dataset.text.tolist()
    gt_labels = df_dataset.label.tolist()
    unique_labels = sorted(set(gt_labels))

    print('Preprocessing all documents..')
    with mp.Pool(processes=mp.cpu_count()) as pool:
        corpus_preprocessed = pool.map(preprocess, raw_corpus)

    ngram_counter = TfidfVectorizer(ngram_range=(1,3), min_df=2)
    ngram_counter.fit([' '.join(d) for d in corpus_preprocessed])
    print('ngrams count:', len(ngram_counter.vocabulary_.keys()))
    ngrams = [w for w in ngram_counter.vocabulary_.keys() if ' ' in w and w.replace(' ', '_') in numberbatch]

    labels_mapping = dict(l.strip().split('\t') for l in open(args.labels_mapping))
    sorted_labels = sorted(set(labels_mapping.values()))

    ###
    #   Generate and filter Label Neighborhoods
    ###
    print('Computing neighborhoods..')
    labels_neighborhoods = {}
    for label in tqdm(sorted_labels):
        labels_neighborhoods[label] = get_label_neighborhood(label, args.depth, numberbatch, args.cache_path, args.prefetch_path)

    filtered_labels_neighborhoods = {}
    for label in sorted_labels:
        filtered_labels_neighborhoods[label] = filter_neighborhoood(labels_neighborhoods[label], args.allowed_rels, args.similarity, args.filter)

    predicted_probs = predict_dataset(corpus_preprocessed, sorted_labels, filtered_labels_neighborhoods, args.similarity, args.use_ngrams, 'max_score')
    predicted_labels = [sorted_labels[p] for p in np.argmax(predicted_probs, axis=1)]

    filename = f"{args.dataset_path.split('/')[-1]}-{args.filter}-{args.similarity}-{args.depth}-{args.use_ngrams}"
    predictions_file_path = os.path.join(args.results_path, filename+'-predictions.npy')
    probs_file_path = os.path.join(args.results_path, filename+'-probabilities.npy')
    report_file_path = os.path.join(args.results_path, filename+'-report.txt')

    os.makedirs(args.results_path, exist_ok=True)
    np.save(open(predictions_file_path, 'wb'), predicted_labels)
    np.save(open(probs_file_path, 'wb'), predicted_probs)

    print('Predictions for the dataset saved at', args.results_path)

    acc, pre, rec, f1, cm, cr = evaluate(predicted_labels, gt_labels, labels_mapping)
    with open(report_file_path, 'w') as f:
        f.write(cr)

    print('Results report saved at', report_file_path)

    ###
    #   Compute the metrics on the dataset for different configurations
    ###

    # for sim in ['simple', 'depth', 'compound', 'harmonized']:
    #     for ng in [True, False]:
    #         for normalize in ['inter_len', 'max_score', 'none']:
    #             filename = f"{args.dataset_path.split('/')[-1]}-{args.filter}-{args.similarity}-{args.depth}-{sim}-{ng}-{normalize}"
    #             print(filename)
    #             predicted_probs = predict_dataset(corpus_preprocessed, sorted_labels, filtered_labels_neighborhoods, sim, ngrams if ng else None, normalize)
    #             np.save(open(os.path.join(args.results_path, filename+'-results.npy'), 'wb'), predicted_probs)
    #             predicted_labels = [sorted_labels[p] for p in np.argmax(predicted_probs, axis=1)]
    #             acc, pre, rec, f1, cm, cr = evaluate(predicted_labels, gt_labels, labels_mapping)
    #             with open(os.path.join(args.results_path, filename+'-report.txt'), 'w') as f:
    #                 f.write(cr)
    #             np.save(open(os.path.join(args.results_path, filename+'-cm.npy'), 'wb'), cm)
    #             with open(os.path.join(args.results_path, 'all-experiments'), 'a') as f:
    #                 f.write(f"{filename}: {acc} {pre} {rec} {f1}")
