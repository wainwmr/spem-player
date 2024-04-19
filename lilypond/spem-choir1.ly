\version "2.24.3" 

\include "spem layout.ly"
\include "spem notes.ly"
\include "spem words.ly"

\score {
  <<
    \time 4/2
    \override Score.BarNumber.break-visibility = ##(#f #t #t)
    <<
      \notesISoprano
      \addlyrics \wordsISoprano
    >>
    <<
      \notesIAlto
      \addlyrics \wordsIAlto
    >>
    <<
      \notesITenor
      \addlyrics \wordsITenor
    >>
    <<
      \notesIBaritone
      \addlyrics \wordsIBaritone
    >>
    <<
      \notesIBass
      \addlyrics \wordsIBass
    >>
  >>
}