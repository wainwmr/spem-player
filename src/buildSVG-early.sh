#!/bin/bash

for i in lilypond/early/spem-choir*.ly; do
  echo "`date`: Generating early SVG for $i..." 
  lilypond --svg -o svg/early/ $i
done