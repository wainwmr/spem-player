\version "2.24.3" 

\include "spem layout.ly"
\include "../spem notes.ly"
\include "../spem words.ly"

\score {
  <<
    \time 4/2
    \override Score.BarNumber.break-visibility = ##(#f #t #t)
    <<
      \new Voice { \clef "treble" \notesVISoprano }
      \addlyrics \wordsVISoprano
    >>
    <<
      \new Voice { \clef "treble" \notesVIAlto }
      \addlyrics \wordsVIAlto
    >>
    <<
      \new Voice { \clef "treble_8" \notesVITenor }
      \addlyrics \wordsVITenor
    >>
    <<
      \new Voice { \clef "bass" \notesVIBaritone }
      \addlyrics \wordsVIBaritone
    >>
    <<
      \new Voice { \clef "bass" \notesVIBass }
      \addlyrics \wordsVIBass
    >>
  >>
}