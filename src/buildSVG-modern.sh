#!/bin/bash

for i in lilypond/modern/spem-choir*.ly; do
  echo "`date`: Generating SVG for $i..." 
  lilypond --svg -o svg/modern/ $i
done