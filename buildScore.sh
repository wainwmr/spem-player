#!/bin/bash

ly=$1
basely="$(basename -- "$ly")"
choir=${basely%.*}
dir=$(dirname "$ly")
type=`echo $dir | sed 's/^.*\///'`
svg="src/scores/$type/${choir}.svg"

echo "`date`: Generating score for $ly..." 
lilypond --svg -o src/scores/$type/ "$ly"

echo "`date`: Removing height= and width= from header of '$svg'"
sed -i '' -E '1,1s/ height="[0-9.]+[a-zA-Z]*"//g; 1,1s/ width="[0-9.]+[a-zA-Z]*"//g' "$svg"