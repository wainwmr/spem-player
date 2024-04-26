\version "2.24.3" 

\include "spem layout.ly"
\include "../spem notes.ly"
\include "../spem words.ly"

\score {
  <<
    \time 4/2
    \override Score.BarNumber.break-visibility = ##(#f #t #t)
    <<
      \new Voice { \clef "treble" \notesIISoprano }
      \addlyrics \wordsIISoprano
    >>
    <<
      \new Voice { \clef "treble" \notesIIAlto }
      \addlyrics \wordsIIAlto
    >>
    <<
      \new Voice { \clef "treble_8" \notesIITenor }
      \addlyrics \wordsIITenor
    >>
    <<
      \new Voice { \clef "bass" \notesIIBaritone }
      \addlyrics \wordsIIBaritone
    >>
    <<
      \new Voice { \clef "bass" \notesIIBass }
      \addlyrics \wordsIIBass
    >>
  >>
}