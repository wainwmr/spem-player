\version "2.24.3" 

\include "spem layout.ly"
\include "../spem notes.ly"
\include "../spem words.ly"

\score {
  <<
    \time 4/2
    \override Score.BarNumber.break-visibility = ##(#f #t #t)
    <<
      \new Voice { \clef "treble" \notesIIISoprano }
      \addlyrics \wordsIIISoprano
    >>
    <<
      \new Voice { \clef "treble" \notesIIIAlto }
      \addlyrics \wordsIIIAlto
    >>
    <<
      \new Voice { \clef "treble_8" \notesIIITenor }
      \addlyrics \wordsIIITenor
    >>
    <<
      \new Voice { \clef "bass" \notesIIIBaritone }
      \addlyrics \wordsIIIBaritone
    >>
    <<
      \new Voice { \clef "bass" \notesIIIBass }
      \addlyrics \wordsIIIBass
    >>
  >>
}