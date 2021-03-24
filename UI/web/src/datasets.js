const datasets = [
  {
    "name": "20NG",
    "description": "20NG: 16 topics coming from the 20 Newsgroups dataset, <a href=\"http://qwone.com/~jason/20Newsgroups/\" rel=\"noopener noreferrer\">http://qwone.com/~jason/20Newsgroups/</a>. From the original topics, \"atheism\", \"christianity\", \"religion\" have been grouped into \"religion\", \"PC hardware\", \"Mac hardware\" into \"hardware\", and \"windows.x\", \"windows.misc\" into \"windows\". The final set of topics are (alphabetically ordered): baseball, car, cryptography, electronics, graphic, gun, hardware, hockey, medicine, middle east, motorcycle, politics, religion, sale, space, windows.",
    "labels": ["baseball", "car", "cryptography", "electronics", "graphic", "gun", "hardware", "hockey", "medicine", "middle_east", "motorcycle", "politics", "religion", "sale", "space", "windows"]
  },
  {
    "name": "IPTC",
    "description": "IPTC: 17 topics coming from the first level of the hierarchy of the IPTC Media Topics defined at <a href=\"http://cv.iptc.org/newscodes/mediatopic/\" rel=\"noopener noreferrer\">http://cv.iptc.org/newscodes/mediatopic/</a>. The list of topics are (alphabetically ordered): art-culture-entertainment, crime-law-justice, disaster-accident, economy-business-finance, education, environment, health, interest-activity, labor, lifestyle-leisure, politics, religion-belief, science-technology, social-issue, sport, unrest-conflict-war, and weather.",
    "labels": ["art-culture-entertainment", "crime-law-justice", "disaster-accident", "economy-business-finance", "environment", "education", "leisure", "lifestyle-leisure", "health", "interest-activity", "politics", "religion-belief","science-technology", "social-issue", "sport", "unrest-conflict-war","weather"]
  },
  {
    "name": "Yahoo! Answers",
    "description": "Yahoo! Answers: 10 most-frequent topics from the Yahoo! Answers Comprehensive Dataset, <a href=\"https://webscope.sandbox.yahoo.com/catalog.php?datatype=l&did=11\" rel=\"noopener noreferrer\">https://webscope.sandbox.yahoo.com/catalog.php?datatype=l&did=11</a>. The set of topics are (alphabetically ordered): business-finance, computer-internet, culture, education-reference, entertainment-music, family-relationships, health, politics-government, science-mathematics, and sports.",
    "labels": ["family-relationships", "entertainment-music", "society-culture", "computer-internet", "health", "business-finance", "education-reference",  "politics-government", "science-mathematics", "sports"]
  },
  {
    "name": "BBC News",
    "description": "BBC News: 5 labels corresponding to the class labels for the BBC News dataset, <a href=\"http://mlg.ucd.ie/datasets/bbc.html\" rel=\"noopener noreferrer\">http://mlg.ucd.ie/datasets/bbc.html</a>. The set of topics are (alphabetically ordered): business, entertainment, politics, sport, and tech.",
    "labels": ["business", "entertainment", "politics", "sport", "tech"]
  },
  {
    "name": "AG News",
    "description": "AG News: 4 labels corresponding to the class labels for the AG News dataset, <a href=\"http://groups.di.unipi.it/~gulli/AG_corpus_of_news_articles.html\" rel=\"noopener noreferrer\">http://groups.di.unipi.it/~gulli/AG_corpus_of_news_articles.html</a>. The set of topics are (alphabetically ordered): business, entertainment, science-technology, and sport.",
    "labels": ["business", "politics", "science-technology", "sport"]
  },
];

export default datasets;