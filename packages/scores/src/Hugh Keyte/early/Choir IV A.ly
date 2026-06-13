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
          \notesIVASoprano
        }
        \addlyrics { \wordsIVASoprano }
      >>
      <<
        \new Voice {
          \clef "mensural-c2"  
          \shiftFirstNote
          \notesIVAAlto
        }
        \addlyrics \wordsIVAAlto
      >>
      <<
        \new Voice {
          \clef "mensural-c3"  
          \shiftFirstNote
          \notesIVATenor
        }
        \addlyrics \wordsIVATenor
      >>
      <<
        \new Voice {
          \clef "mensural-f"
          \shiftFirstNote
          \notesIVABaritone
        }
        \addlyrics \wordsIVABaritone
      >>
      <<
        \new Voice {
          \clef "mensural-f"
          \shiftFirstNote
          \notesIVABass
        }
        \addlyrics \wordsIVABass
      >>
    >>
  \layout {
    \override Staff.Accidental.alteration-glyph-name-alist = #standard-alteration-glyph-name-alist
  }
}