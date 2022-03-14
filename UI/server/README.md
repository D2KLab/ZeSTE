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