\version "2.24.3" 

\include "spem layout.ly"
\include "spem notes.ly"
\include "spem words.ly"

\score {

  <<
    \time 4/2
    \override Score.BarNumber.break-visibility = ##(#f #t #t)
    <<
      \notesVSoprano
      \addlyrics \wordsVSoprano
    >>
    <<
      \notesVAlto
      \addlyrics \wordsVAlto
    >>
    <<
      \notesVTenor
      \addlyrics \wordsVTenor
    >>
    <<
      \notesVBaritone
      \addlyrics \wordsVBaritone
    >>
    <<
      \notesVBass
      \addlyrics \wordsVBass
    >>
  >>

  \layout {
    \context {
      \Staff
      \consists Ambitus_engraver
    }
  }
}