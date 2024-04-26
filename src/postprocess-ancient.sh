#!/bin/bash

outfile=js/barlines-ancient.js
touch $outfile

echo "`date`: Generating $outfile"
echo "// Generated by $0 at `date`" > $outfile
echo "export const scorebars_ancient = [" >> $outfile
for i in svg/ancient/spem-choir*.svg; do
  echo -n "  [0, " >> $outfile
  grep -B 2 '<tspan>[0-9]*</tspan>' "$i" | sed -n 's/^.*translate(\([^,]*\),.*$/\1/p' | sort -n | sed 's/$/, /' | tr -d '\n' >> $outfile
  echo "]," >> $outfile
done
echo "];" >> $outfile


echo "`date`: Removing height and width from header of spem-choir*.svg"
for i in svg/ancient/spem-choir*.svg; do
  sed -i '' -E '1,1s/ width="[0-9.]+[a-zA-Z]*"//g' "$i"
  sed -i '' -E '1,1s/ height="[0-9.]+[a-zA-Z]*"//g' "$i"
  sed -i '' -E '1,1s/ viewBox="[0-9. ]*"/ viewBox="0 0 3700 63"/g' "$i"
done