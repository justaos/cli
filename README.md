## JUSTAOS CLI

A command line interface for JUSTAOS.

[![Build](https://github.com/justaos/cli/workflows/Build/badge.svg)](https://github.com/justaos/cli/actions?workflow=Build)

## Prerequisites

- Install deno (version 1.29.1)\
  https://deno.land/manual@v1.29.1/getting_started/installation

- Install mongodb\
  https://www.mongodb.com/download-center?#community


## Setup

![Set up](resources/setup.svg)

```bash
deno install -A --unstable -n justaos https://deno.land/x/justaos/mod.ts
```
## Commands

### justaos new <project-name>

The JUSTAOS CLI makes it easy to create an application that already works, right
out of the box.


### justaos run

Easily start your JUSTAOS and load installed cloud applications on platform.

Check configuration in config.json before running the JUSTAOS.

By default, platform starts on port 8080. Open
[http://localhost:8080](http://localhost:8080) to view the landing page of
JUSTAOS.

## Code of Conduct

[Contributor Covenant](/CODE_OF_CONDUCT.md)

## License

[Apache License 2.0](/LICENSE)
