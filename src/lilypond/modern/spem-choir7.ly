\version "2.24.3" 

\include "spem layout.ly"
\include "../spem notes.ly"
\include "../spem words.ly"

\score {
  <<
    \time 4/2
    \override Score.BarNumber.break-visibility = ##(#f #t #t)
    <<
      \new Voice { \clef "treble" \notesVIISoprano }
      \addlyrics \wordsVIISoprano
    >>
    <<
      \new Voice { \clef "treble" \notesVIIAlto }
      \addlyrics \wordsVIIAlto
    >>
    <<
      \new Voice { \clef "treble_8" \notesVIITenor }
      \addlyrics \wordsVIITenor
    >>
    <<
      \new Voice { \clef "bass" \notesVIIBaritone }
      \addlyrics \wordsVIIBaritone
    >>
    <<
      \new Voice { \clef "bass" \notesVIIBass }
      \addlyrics \wordsVIIBass
    >>
  >>
}