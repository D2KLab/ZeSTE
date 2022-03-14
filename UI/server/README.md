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

1. Download [zeste_cache.tar.gz]() and extract it into `ZeSTE/UI/server/zeste_cache`
1. Run the docker image:
```sh
docker run -p 5000:5000 -v "$(pwd)"/zeste_cache:/data/zeste_cache --name mle-zeste zeste_server
```