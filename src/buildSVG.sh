#!/bin/bash

for i in lilypond/spem-choir*.ly; do
  echo "`date`: Generating SVG for $i..." 
  lilypond --svg -o svg $i
done