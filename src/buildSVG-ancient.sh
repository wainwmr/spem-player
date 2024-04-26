#!/bin/bash

for i in lilypond/ancient/spem-choir*.ly; do
  echo "`date`: Generating SVG for $i..." 
  lilypond --svg -o svg/ancient/ $i
done