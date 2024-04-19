\version "2.24.3" 

\include "spem layout.ly"
\include "spem notes.ly"
\include "spem words.ly"

\score {

  <<
    \time 4/2
    \override Score.BarNumber.break-visibility = ##(#f #t #t)
    <<
      \notesIVSoprano
      \addlyrics \wordsIVSoprano
    >>
    <<
      \notesIVAlto
      \addlyrics \wordsIVAlto
    >>
    <<
      \notesIVTenor
      \addlyrics \wordsIVTenor
    >>
    <<
      \notesIVBaritone
      \addlyrics \wordsIVBaritone
    >>
    <<
      \notesIVBass
      \addlyrics \wordsIVBass
    >>
  >>
}