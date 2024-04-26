\version "2.24.3" 

\include "spem layout.ly"
\include "../spem notes.ly"
\include "../spem words.ly"

\score {
  <<
    \time 4/2
    \override Score.BarNumber.break-visibility = ##(#f #t #t)
    <<
      \new Voice { \clef "treble" \notesISoprano }
      \addlyrics \wordsISoprano
    >>
    <<
      \new Voice { \clef "treble" \notesIAlto }
      \addlyrics \wordsIAlto
    >>
    <<
      \new Voice { \clef "treble_8" \notesITenor }
      \addlyrics \wordsITenor
    >>
    <<
      \new Voice { \clef "bass" \notesIBaritone }
      \addlyrics \wordsIBaritone
    >>
    <<
      \new Voice { \clef "bass" \notesIBass }
      \addlyrics \wordsIBass
    >>
  >>
}