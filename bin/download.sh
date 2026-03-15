#!/bin/bash

timestamp=$1
title=$2
author=$3
narrator=$4
links=("${@:6}")

download() {
  timestamp=$1
  title=$2
  links=("${@:3}")
  part=1

  for LINK in "${links[@]}"; do
    yt-dlp -x --audio-format m4a --js-runtimes node --split-chapters \
      -P "data/tmp/$timestamp" \
      -o "chapter:chapters/part$part/%(section_number)s-%(section_start)s-%(section_end)s-%(section_title)s.%(ext)s" \
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
  complete_path="data/complete/$timestamp"

  echo "Combining files for title: $path/$title"

  touch $path/filelist.txt
  echo ";FFMETADATA1" > $path/metadata.txt
  echo "title=$title" >> $path/metadata.txt
  echo "artist=$author" >> $path/metadata.txt
  echo "narrator=$narrator" >> $path/metadata.txt

  partEnd=0

  mkdir -p $complete_path

  for partPath in $path/chapters/part*; do
    mapfile -d '' files < <(find $partPath/*.m4a -maxdepth 1 -type f -printf '%f\0' | sort -zV)

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
      printf "file '%s'\n" "chapters/$partName"/"$filename.m4a" >> $path/filelist.txt;
    done

    partEnd=$(echo "scale=2; $partEnd + $end" | bc)
  done

  # If filelist.txt is empty, populate it with the files in the part directories
  if [ ! -s $path/filelist.txt ]; then
    for partPath in $path/part*; do
      for file in $partPath/*.m4a; do
        partName=$(basename "$partPath")
        filename=$(basename "$file" .m4a)
        echo "file '$partName/$filename.m4a'" >> $path/filelist.txt
      done
    done
  fi

  ffmpeg -loglevel error -f concat -safe 0 -i $path/filelist.txt -c copy "$path/$title.m4a" -y
  ffmpeg -loglevel error -i "$path/$title.m4a" -i $path/metadata.txt -map_metadata 1 -c copy "$complete_path/$title.m4b" -y
}

download $timestamp "$title" "${links[@]}"
combine $timestamp "$title" "$author" "$narrator"

# rm -rf "data/tmp/$timestamp"