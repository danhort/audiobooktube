#!/bin/bash

timestamp=$1
title=$2
author=$3
narrator=$4
mediaDestination=$5
links=("${@:6}")

download() {
  timestamp=$1
  title=$2
  links=("${@:3}")
  part=1

  for LINK in "${links[@]}"; do
    yt-dlp -x --audio-format m4a --js-runtimes node --split-chapters \
      -P "data/tmp/$timestamp" \
      -o "chapter:part$part/chapters/%(section_number)s-%(section_start)s-%(section_end)s-%(section_title)s.%(ext)s" \
      -o "part$part/$title.%(ext)s" $LINK

    ((part++))
  done
}

combine() {
  timestamp=$1
  title=$2
  author=$3
  narrator=$4
  path="data/tmp/$timestamp"
  completePath=data/complete/$timestamp

  echo "Combining files for title: $title"

  touch $path/filelist.txt
  echo ";FFMETADATA1" > $path/metadata.txt
  echo "title=$title" >> $path/metadata.txt
  echo "artist=$author" >> $path/metadata.txt
  echo "narrator=$narrator" >> $path/metadata.txt

  partEnd=0

  mkdir -p $completePath

  for partPath in $path/part*; do
    mapfile -d '' files < <(find $partPath/chapters/*.m4a -maxdepth 1 -type f -printf '%f\0' | sort -zV)

    for file in "${files[@]}"; do
      partName=$(basename "$partPath")
      filename=$(basename "$file" .m4a)

      echo "[CHAPTER]" >> $path/metadata.txt
      echo "TIMEBASE=1/1" >> $path/metadata.txt

      start=$(echo $filename | cut -d'-' -f2)
      start=$(echo "scale=2; $start + $partEnd" | bc)
      end=$(echo $filename | cut -d'-' -f3)
      end=$(echo "scale=2; $end + $partEnd" | bc)
      chapter_title=$(echo $filename | cut -d'-' -f4)

      echo "START=$start" >> $path/metadata.txt
      echo "END=$end" >> $path/metadata.txt
      echo "title=$chapter_title" >> $path/metadata.txt
      printf "file '%s'\n" "$partName"/chapters/"$filename.m4a" >> $path/filelist.txt;
    done

    partEnd=$(echo "scale=2; $partEnd + $end" | bc)

    # if chapter folder does not exist, add the part file directly to the filelist
    if [ ! -d $partPath/chapters ]; then
      for file in $partPath/*.m4a; do
        partName=$(basename "$partPath")
        filename=$(basename "$file" .m4a)
        echo "file '$partName/$filename.m4a'" >> $path/filelist.txt
      done
    fi
  done

  ffmpeg -loglevel error -f concat -safe 0 -i $path/filelist.txt -c copy $path/"$title".m4a -y
  ffmpeg -loglevel error -i $path/"$title".m4a -i $path/metadata.txt -map_metadata 1 -c copy $completePath/"$title".m4b -y
}

download $timestamp "$title" "${links[@]}"
combine $timestamp "$title" "$author" "$narrator"

rm -rf "data/tmp/$timestamp"
mkdir -p "$mediaDestination"/"$title"
cp data/complete/$timestamp/"$title".m4b "$mediaDestination"/"$title"/"$title.m4b"
echo "Download and combination complete for title: $title"