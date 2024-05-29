#!/bin/bash

for i in ../public/lilypond/modern/spem-choir*.ly; do
  echo "`date`: Generating SVG for $i..." 
  lilypond --svg -o ../public/svg/modern/ $i
done