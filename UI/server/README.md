## How to build

1. Clone this repository:
    ```sh
    git clone https://github.com/D2KLab/ZeSTE.git
    ```

1. Build the docker image:
    ```sh
    cd ZeSTE/UI/server
    docker build -t d2klab/zeste_server .
    ```

## How to run

1. Download [zeste_cache.tar.gz]() and extract its content into `ZeSTE/UI/server/zeste_cache` with:
    ```sh
    cd ZeSTE/UI/server
    mkdir zeste_cache/
    tar -zxvf zeste_cache.tar.gz -C zeste_cache/
    ```
    _You can now safely remove zeste_cache.tar.gz._

1. Run the docker image:
    ```sh
    docker run -p 5000:5000 -v "$(pwd)"/zeste_cache:/data/zeste_cache --name mle-zeste d2klab/zeste_server
    ```
    To disallow some relations, specify the `--disallowed-rels` parameter.

    Example with disallowing the "antonym" relation:
    ```sh
    docker run -p 5000:5000 -v "$(pwd)"/zeste_cache:/data/zeste_cache --name mle-zeste d2klab/zeste_server --disallowed-rels "antonym"
    ```

### Parameters

| Parameter | Description |
| --- | --- |
| -v, --verbose | Add extra verbose to the logging output |
| --disallowed-rels | List of semicolon-separated relations that are disallowed (eg. `--disallowed-rels "antonym;motivatedbygoal"`. For a list of all relations, check `/zeste_cache/relations_descriptions.txt` |
