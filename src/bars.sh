#!/bin/bash
outfile=$2
touch $outfile

echo "const scorebars = [" > $outfile
for i in $1/spem-choir*.svg; do
  echo -n "  [" >> $outfile
  grep -B 2 '<tspan>[0-9]*</tspan>' $i | sed -n 's/^.*translate(\([^,]*\),.*$/\1/p' | sort -n | sed 's/$/, /' | tr -d '\n' >> $outfile
  echo "]," >> $outfile
done
echo "];" >> $outfile

echo "Copied to clipboard"
cat $outfile | pbcopy