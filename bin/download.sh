#!/bin/bash

timestamp=$1
title=$2
author=$3
narrator=$4
media_location=$3
links=("${@:6}")

download() {
  timestamp=$1
  links=("${@:2}")
  part=1

  for LINK in "${links[@]}"; do
    yt-dlp -x --audio-format m4a --js-runtimes node --split-chapters -P "data/tmp/$timestamp" -o "chapter:part$part/%(section_number)s-%(section_start)s-%(section_end)s-%(section_title)s.%(ext)s" $LINK
    ((part++))
  done
}

combine() {
  timestamp=$1
  title=$2
  author=$3
  narrator=$4
  path="data/tmp/$timestamp"
  complete_path="data/complete/$timestamp"

  echo "Combining files for title: $path/$title"

  touch $path/filelist.txt
  echo ";FFMETADATA1" > $path/chapters_metadata.txt
  echo "title=$title" >> $path/chapters_metadata.txt
  echo "artist=$author" >> $path/chapters_metadata.txt
  echo "narrator=$narrator" >> $path/chapters_metadata.txt

  partEnd=0

  mkdir -p $complete_path

  for partPath in $path/part*; do
    mapfile -d '' files < <(find $partPath/*.m4a -maxdepth 1 -type f -printf '%f\0' | sort -zV)

    for file in "${files[@]}"; do
      partName=$(basename "$partPath")
      filename=$(basename "$file" .m4a)

      echo "[CHAPTER]" >> $path/chapters_metadata.txt
      echo "TIMEBASE=1/1" >> $path/chapters_metadata.txt

      start=$(echo $filename | cut -d'-' -f2)
      start=$(echo "scale=2; $start + $partEnd" | bc)
      end=$(echo $filename | cut -d'-' -f3)
      end=$(echo "scale=2; $end + $partEnd" | bc)
      chapter_title=$(echo $filename | cut -d'-' -f4)

      echo "START=$start" >> $path/chapters_metadata.txt
      echo "END=$end" >> $path/chapters_metadata.txt
      echo "title=$chapter_title" >> $path/chapters_metadata.txt
      printf "file '%s'\n" "$partName"/"$filename.m4a" >> $path/filelist.txt;
    done

    partEnd=$(echo "scale=2; $partEnd + $end" | bc)
  done

  ffmpeg -loglevel error -f concat -safe 0 -i $path/filelist.txt -c copy "$path/$title.m4a" -y
  ffmpeg -loglevel error -i "$path/$title.m4a" -i $path/chapters_metadata.txt -map_metadata 1 -c copy "$complete_path/$title.m4b" -y
}

download $timestamp "${links[@]}"
combine $timestamp "$title" "$author" "$narrator"

rm -rf "data/tmp/$timestamp"
mkdir -p "$media_location/$title"
mv "$complete_path/$title.m4b" "$media_location/$title/$title.m4b"