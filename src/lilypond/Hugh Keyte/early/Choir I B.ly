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
          \notesIBSoprano
        }
        \addlyrics { \wordsIBSoprano }
      >>
      <<
        \new Voice {
          \clef "mensural-c2"  
          \shiftFirstNote
          \notesIBAlto
        }
        \addlyrics \wordsIBAlto
      >>
      <<
        \new Voice {
          \clef "mensural-c3"  
          \shiftFirstNote
          \notesIBTenor
        }
        \addlyrics \wordsIBTenor
      >>
      <<
        \new Voice {
          \clef "mensural-f"
          \shiftFirstNote
          \notesIBBaritone
        }
        \addlyrics \wordsIBBaritone
      >>
      <<
        \new Voice {
          \clef "mensural-f"
          \shiftFirstNote
          \notesIBBass
        }
        \addlyrics \wordsIBBass
      >>
    >>
  \layout {
    \override Staff.Accidental.alteration-glyph-name-alist = #standard-alteration-glyph-name-alist
  }
}