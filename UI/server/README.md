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
    tar -zxvf zeste_cache.tar.gz
    ```
    _You can now safely remove zeste_cache.tar.gz._

1. Run the docker image:
    ```sh
    docker run -p 5000:5000 -v "$(pwd)"/zeste_cache:/data/zeste_cache --name zeste-server d2klab/zeste_server
    ```
    To disallow some relations, specify the `--disallowed-rels` parameter.

    Example with disallowing the "antonym" relation:
    ```sh
    docker run -p 5000:5000 -v "$(pwd)"/zeste_cache:/data/zeste_cache --name zeste-server d2klab/zeste_server --disallowed-rels "antonym"
    ```

### Parameters

| Parameter | Description |
| --- | --- |
| -v, --verbose | Add extra verbose to the logging output |
| --disallowed-rels | List of semicolon-separated relations that are disallowed (eg. `--disallowed-rels "antonym;motivatedbygoal"`. For a list of all relations, check `/zeste_cache/relations_descriptions.txt` |

### Example

```sh
curl -XPOST 'http://localhost:5000/api/predict' -H'Content-Type: application/json' -d'{
    "labels": ["business", "technology", "hardware", "software"],
    "language": "en",
    "text": "A NASA spacecraft set a new milestone Monday in cosmic exploration by entering orbit around an asteroid, Bennu, the smallest object ever to be circled by a human-made spaceship. The spacecraft, called OSIRIS-REx, is the first-ever US mission designed to visit an asteroid and return a sample of its dust back to Earth..",
    "explain": false,
    "highlights": false
}'
```
