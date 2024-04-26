\version "2.24.3" 

\include "spem layout.ly"
\include "../spem notes.ly"
\include "../spem words.ly"

\score {
  <<
    \time 4/2
    \override Score.BarNumber.break-visibility = ##(#f #t #t)
    <<
      \new Voice { \clef "treble" \notesIVSoprano }
      \addlyrics \wordsIVSoprano
    >>
    <<
      \new Voice { \clef "treble" \notesIVAlto }
      \addlyrics \wordsIVAlto
    >>
    <<
      \new Voice { \clef "treble_8" \notesIVTenor }
      \addlyrics \wordsIVTenor
    >>
    <<
      \new Voice { \clef "bass" \notesIVBaritone }
      \addlyrics \wordsIVBaritone
    >>
    <<
      \new Voice { \clef "bass" \notesIVBass }
      \addlyrics \wordsIVBass
    >>
  >>
}