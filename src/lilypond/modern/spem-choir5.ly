\version "2.24.3" 

\include "spem layout.ly"
\include "../spem notes.ly"
\include "../spem words.ly"

\score {
  <<
    \time 4/2
    \override Score.BarNumber.break-visibility = ##(#f #t #t)
    <<
      \new Voice { \clef "treble" \notesVSoprano }
      \addlyrics \wordsVSoprano
    >>
    <<
      \new Voice { \clef "treble" \notesVAlto }
      \addlyrics \wordsVAlto
    >>
    <<
      \new Voice { \clef "treble_8" \notesVTenor }
      \addlyrics \wordsVTenor
    >>
    <<
      \new Voice { \clef "bass" \notesVBaritone }
      \addlyrics \wordsVBaritone
    >>
    <<
      \new Voice { \clef "bass" \notesVBass }
      \addlyrics \wordsVBass
    >>
  >>
}