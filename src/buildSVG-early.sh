#!/bin/bash

for i in ../public/lilypond/early/spem-choir*.ly; do
  echo "`date`: Generating early SVG for $i..." 
  lilypond --svg -o ../public/svg/early/ $i
done