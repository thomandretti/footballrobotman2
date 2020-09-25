# FootballRobotMan

This is a very silly discord bot built around a fantasy football league. It can do a few pretty random things

1. Respond to messages containing certain words/phrases with a predefined response
1. Respond to commands starting with a given prefix. The following commands are supported
    * `standings` - send a summary of the current league standings
1. Post standings on a schedule

## Technologies

* Typescript 4
* Node 12
* Docker 19

## Setup

TODO: dev container?

1. Install prerequisites

    * nvm
        follow https://github.com/nvm-sh/nvm#installing-and-updating
    * node.js, npm
        ```sh
        nvm install node
        ```

2. Add a file at `config/default.yaml` specifying config values. See [CONFIG.md](config/CONFIG.md)

3. Run the app
    ```sh
    npm install
    npm run start
    ```

## Deployment

This currently gets deployed as a docker container. To package and run the 'production' version, do the following from the project root

```sh
docker build -t "$USER/footballrobotman2" .
docker start "$USER/footballrobotman2"
```

TODO: add an npm script for this