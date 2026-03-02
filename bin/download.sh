#!/bin/bash

ID=$1
TITLE=$2
MEDIA_LOCATION=$3
shift 3
LINKS=("$@")

for LINK in "${LINKS[@]}"; do
  yt-dlp -x --audio-format m4a --js-runtimes node ${LINK} -o "data/tmp/${ID}/%(title)s.%(ext)s"
done

mkdir -p "data/complete/${TITLE}"

if [ ${#LINKS[@]} -gt 1 ]; then
  ./bin/combine.sh "${ID}" "${TITLE}"
else
  mv data/tmp/${ID}/*.m4a data/complete/${TITLE}/${TITLE}.m4a
fi

mv "data/complete/${TITLE}" "${MEDIA_LOCATION}/${TITLE}"
rm -rf data/tmp/${ID}