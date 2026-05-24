\version "2.26.0" 

\include "layout.ly"
\include "../spem.ly"
\include "../spem words.ly"

\score {

  <<
      \override Score.BarNumber.break-visibility = ##(#f #t #t)
      \override Score.BarNumber.font-size = #1
      <<
        \new Voice {
          \clef "mensural-c1"  
          \shiftFirstNote
          \notesIIIBSoprano
        }
        \addlyrics { \wordsIIIBSoprano }
      >>
      <<
        \new Voice {
          \clef "mensural-c2"  
          \shiftFirstNote
          \notesIIIBAlto
        }
        \addlyrics \wordsIIIBAlto
      >>
      <<
        \new Voice {
          \clef "mensural-c3"  
          \shiftFirstNote
          \notesIIIBTenor
        }
        \addlyrics \wordsIIIBTenor
      >>
      <<
        \new Voice {
          \clef "mensural-f"
          \shiftFirstNote
          \notesIIIBBaritone
        }
        \addlyrics \wordsIIIBBaritone
      >>
      <<
        \new Voice {
          \clef "mensural-f"
          \shiftFirstNote
          \notesIIIBBass
        }
        \addlyrics \wordsIIIBBass
      >>
    >>
  \layout {
    \override Staff.Accidental.alteration-glyph-name-alist = #standard-alteration-glyph-name-alist
  }
}