#!/bin/bash

for ly in src/lilypond/**/Choir*.ly; do
  ./buildScore.sh "$ly"
done