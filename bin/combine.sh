#!/bin/sh

ID=$1
TITLE=$2

echo "Combining files for ID: ${ID}, Title: ${TITLE}"

for f in data/tmp/${ID}/*.m4a; do printf "file '%s'\n" "${f##*/}"; done > "data/tmp/${ID}/filelist.txt"
ffmpeg -loglevel error -f concat -safe 0 -i data/tmp/${ID}/filelist.txt -c copy "data/complete/${TITLE}.m4a" -y