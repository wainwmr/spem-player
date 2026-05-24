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
          \notesIIIASoprano
        }
        \addlyrics { \wordsIIIASoprano }
      >>
      <<
        \new Voice {
          \clef "mensural-c2"  
          \shiftFirstNote
          \notesIIIAAlto
        }
        \addlyrics \wordsIIIAAlto
      >>
      <<
        \new Voice {
          \clef "mensural-c3"  
          \shiftFirstNote
          \notesIIIATenor
        }
        \addlyrics \wordsIIIATenor
      >>
      <<
        \new Voice {
          \clef "mensural-f"
          \shiftFirstNote
          \notesIIIABaritone
        }
        \addlyrics \wordsIIIABaritone
      >>
      <<
        \new Voice {
          \clef "mensural-f"
          \shiftFirstNote
          \notesIIIABass
        }
        \addlyrics \wordsIIIABass
      >>
    >>
  \layout {
    \override Staff.Accidental.alteration-glyph-name-alist = #standard-alteration-glyph-name-alist
  }
}