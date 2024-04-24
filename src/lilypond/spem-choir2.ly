\version "2.24.3" 

\include "spem layout.ly"
\include "spem notes.ly"
\include "spem words.ly"

\score {

  <<
    \time 4/2
    \override Score.BarNumber.break-visibility = ##(#f #t #t)
    <<
      \notesIISoprano
      \addlyrics \wordsIISoprano
    >>
    <<
      \notesIIAlto
      \addlyrics \wordsIIAlto
    >>
    <<
      \notesIITenor
      \addlyrics \wordsIITenor
    >>
    <<
      \notesIIBaritone
      \addlyrics \wordsIIBaritone
    >>
    <<
      \notesIIBass
      \addlyrics \wordsIIBass
    >>
  >>
}