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
          \notesIVBSoprano
        }
        \addlyrics { \wordsIVBSoprano }
      >>
      <<
        \new Voice {
          \clef "mensural-c2"  
          \shiftFirstNote
          \notesIVBAlto
        }
        \addlyrics \wordsIVBAlto
      >>
      <<
        \new Voice {
          \clef "mensural-c3"  
          \shiftFirstNote
          \notesIVBTenor
        }
        \addlyrics \wordsIVBTenor
      >>
      <<
        \new Voice {
          \clef "mensural-f"
          \shiftFirstNote
          \notesIVBBaritone
        }
        \addlyrics \wordsIVBBaritone
      >>
      <<
        \new Voice {
          \clef "mensural-f"
          \shiftFirstNote
          \notesIVBBass
        }
        \addlyrics \wordsIVBBass
      >>
    >>
  \layout {
    \override Staff.Accidental.alteration-glyph-name-alist = #standard-alteration-glyph-name-alist
  }
}