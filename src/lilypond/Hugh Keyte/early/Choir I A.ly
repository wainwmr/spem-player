\version "2.26.0" 

\include "layout.ly"
\include "../spem.ly"
\include "../spem words.ly"

\score {

  <<
    % \new StaffGroup = choirStaff <<
      \override Score.BarNumber.break-visibility = ##(#f #t #t)
      \override Score.BarNumber.font-size = #1

      <<
        \new Voice {
          \clef "mensural-c1"  
          \shiftFirstNote
          \notesIASoprano
        }
        \addlyrics { \wordsIASoprano }
      >>
      <<
        \new Voice {
          \clef "mensural-c2"  
          \shiftFirstNote
          \notesIAAlto
        }
        \addlyrics \wordsIAAlto
      >>
      <<
        \new Voice {
          \clef "mensural-c3"  
          \shiftFirstNote
          \notesIATenor
        }
        \addlyrics \wordsIATenor
      >>
      <<
        \new Voice {
          \clef "mensural-f"
          \shiftFirstNote
          \notesIABaritone
        }
        \addlyrics \wordsIABaritone
      >>
      <<
        \new Voice {
          \clef "mensural-f"
          \shiftFirstNote
          \notesIABass
        }
        \addlyrics \wordsIABass
      >>
    >>
  % >>
  \layout {
    \override Staff.Accidental.alteration-glyph-name-alist = #standard-alteration-glyph-name-alist
  }
}