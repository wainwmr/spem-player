\version "2.26.0" 

\include "layout.ly"
\include "../spem.ly"
shiftFirstNote = { \once \override NoteColumn.X-offset = #1 }
\include "../spem words.ly"

\score {

  <<
      \override Score.BarNumber.break-visibility = ##(#f #t #t)
      \override Score.BarNumber.font-size = #1
      <<
        \new Voice {
          \clef "mensural-c1"  
          \shiftFirstNote
          \notesIIBSoprano
        }
        \addlyrics { \wordsIIBSoprano }
      >>
      <<
        \new Voice {
          \clef "mensural-c2"  
          \shiftFirstNote
          \notesIIBAlto
        }
        \addlyrics \wordsIIBAlto
      >>
      <<
        \new Voice {
          \clef "mensural-c3"  
          \shiftFirstNote
          \notesIIBTenor
        }
        \addlyrics \wordsIIBTenor
      >>
      <<
        \new Voice {
          \clef "mensural-f"
          \shiftFirstNote
          \notesIIBBaritone
        }
        \addlyrics \wordsIIBBaritone
      >>
      <<
        \new Voice {
          \clef "mensural-f"
          \shiftFirstNote
          \notesIIBBass
        }
        \addlyrics \wordsIIBBass
      >>
    >>
  \layout {
    \override Staff.Accidental.alteration-glyph-name-alist = #standard-alteration-glyph-name-alist
  }
}