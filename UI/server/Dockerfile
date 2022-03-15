FROM python:3.7-buster
WORKDIR /code
ENV PYTHONUNBUFFERED=1
ENV FLASK_APP=server.py
ENV FLASK_RUN_HOST=0.0.0.0
RUN apt-get install -y gcc g++
COPY requirements.txt requirements.txt
RUN pip install -r requirements.txt
RUN python -m nltk.downloader stopwords wordnet
EXPOSE 5000
COPY . .
ENTRYPOINT ["python", "server.py"]