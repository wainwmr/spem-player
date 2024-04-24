#!/bin/bash
for i in spem-choir*.svg; do
  echo $i
  sed -i '' -E '1,1s/ height="[0-9.]+[a-zA-Z]*"//g; 1,1s/ width="[0-9.]+[a-zA-Z]*"//g' $i
done
