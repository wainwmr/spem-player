\version "2.24.3" 

\include "spem layout.ly"
\include "../spem notes.ly"
\include "../spem words.ly"

\score {

  <<
    \new StaffGroup = choirStaff <<
      \override Score.BarNumber.break-visibility = ##(#f #t #t)
      <<
        \new Voice {
          \clef "mensural-c1"  
          \notesVSoprano
        }
        \addlyrics { \wordsVSoprano }
      >>
      <<
        \new Voice {
          \clef "mensural-c2"  
          \notesVAlto
        }
        \addlyrics \wordsVAlto
      >>
      <<
        \new Voice {
          \clef "mensural-c3"  
          \notesVTenor
        }
        \addlyrics \wordsVTenor
      >>
      <<
        \new Voice {
          \clef "mensural-f"
          \notesVBaritone
        }
        \addlyrics \wordsVBaritone
      >>
      <<
        \new Voice {
          \clef "mensural-f"
          \notesVBass
        }
        \addlyrics \wordsVBass
      >>
    >>
  >>
  \layout {
    \override Staff.Accidental.alteration-glyph-name-alist = #standard-alteration-glyph-name-alist
  }
}