\version "2.24.3" 

\include "layout.ly"
\include "../spem.ly"
\include "../spem words.ly"

\score {

  <<
      \override Score.BarNumber.break-visibility = ##(#f #t #t)
      <<
        \new Voice {
          \clef "mensural-c1"  
          \notesIVSoprano
        }
        \addlyrics { \wordsIVSoprano }
      >>
      <<
        \new Voice {
          \clef "mensural-c2"  
          \notesIVAlto
        }
        \addlyrics \wordsIVAlto
      >>
      <<
        \new Voice {
          \clef "mensural-c3"  
          \notesIVTenor
        }
        \addlyrics \wordsIVTenor
      >>
      <<
        \new Voice {
          \clef "mensural-f"
          \notesIVBaritone
        }
        \addlyrics \wordsIVBaritone
      >>
      <<
        \new Voice {
          \clef "mensural-f"
          \notesIVBass
        }
        \addlyrics \wordsIVBass
      >>
    >>
  \layout {
    \override Staff.Accidental.alteration-glyph-name-alist = #standard-alteration-glyph-name-alist
  }
}