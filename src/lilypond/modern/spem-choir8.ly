\version "2.24.3" 

\include "spem layout.ly"
\include "../spem notes.ly"
\include "../spem words.ly"

\score {
  <<
    \time 4/2
    \override Score.BarNumber.break-visibility = ##(#f #t #t)
    <<
      \new Voice { \clef "treble" \notesVIIISoprano }
      \addlyrics \wordsVIIISoprano
    >>
    <<
      \new Voice { \clef "treble" \notesVIIIAlto }
      \addlyrics \wordsVIIIAlto
    >>
    <<
      \new Voice { \clef "treble_8" \notesVIIITenor }
      \addlyrics \wordsVIIITenor
    >>
    <<
      \new Voice { \clef "bass" \notesVIIIBaritone }
      \addlyrics \wordsVIIIBaritone
    >>
    <<
      \new Voice { \clef "bass" \notesVIIIBass }
      \addlyrics \wordsVIIIBass
    >>
  >>
}