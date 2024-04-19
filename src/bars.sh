#!/bin/bash
tempfile=$0.temp
touch $tempfile

echo "const scorebars = [" > $tempfile
for i in $1/spem-choir*.svg; do
  echo -n "  [" >> $tempfile
  grep -B 2 '<tspan>[0-9]*</tspan>' $i | sed -n 's/^.*translate(\([^,]*\),.*$/\1/p' | sort -n | sed 's/$/, /' | tr -d '\n' >> $tempfile
  echo "]," >> $tempfile
done
echo "];" >> $tempfile

echo "Copied to clipboard"
cat $tempfile | pbcopy
rm $tempfile