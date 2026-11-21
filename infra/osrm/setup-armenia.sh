#!/usr/bin/env bash
set -euo pipefail

mkdir -p "$(dirname "$0")/data"
cd "$(dirname "$0")/data"

if [ ! -f armenia-latest.osm.pbf ]; then
  curl -L -o armenia-latest.osm.pbf https://download.geofabrik.de/asia/armenia-latest.osm.pbf
fi

docker run --rm -t -v "$PWD:/data" ghcr.io/project-osrm/osrm-backend:latest osrm-extract -p /opt/car.lua /data/armenia-latest.osm.pbf
docker run --rm -t -v "$PWD:/data" ghcr.io/project-osrm/osrm-backend:latest osrm-partition /data/armenia-latest.osrm
docker run --rm -t -v "$PWD:/data" ghcr.io/project-osrm/osrm-backend:latest osrm-customize /data/armenia-latest.osrm

echo "OSRM Armenia map ready. Start with: docker compose --profile geo up -d"
