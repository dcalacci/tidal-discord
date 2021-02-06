#!/usr/bin/env bash

docker run --env-file docker.env -v /media/nfs/music/@library:/music -v /media/nfs/music/import/discord:/downloads dcalacci/tidal-discord:latest 
