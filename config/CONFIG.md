# Configuration

## Setup

The application uses the npm module [config](https://www.npmjs.com/package/config) to resolve configuration values at runtime.

At a minimum, place a file called `default.yaml` in this directory specifying configuration values. See `example.yaml` for the expected structure.

## Notes

- The project's `.gitignore` contains paths for `default.yaml` and `production.yaml` to make it harder to accidentally check in these files.
- There is probably a better way to do this, but I am lazy.
