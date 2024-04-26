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
          \notesVISoprano
        }
        \addlyrics { \wordsVISoprano }
      >>
      <<
        \new Voice {
          \clef "mensural-c2"  
          \notesVIAlto
        }
        \addlyrics \wordsVIAlto
      >>
      <<
        \new Voice {
          \clef "mensural-c3"  
          \notesVITenor
        }
        \addlyrics \wordsVITenor
      >>
      <<
        \new Voice {
          \clef "mensural-f"
          \notesVIBaritone
        }
        \addlyrics \wordsVIBaritone
      >>
      <<
        \new Voice {
          \clef "mensural-f"
          \notesVIBass
        }
        \addlyrics \wordsVIBass
      >>
    >>
  >>
  \layout {
    \override Staff.Accidental.alteration-glyph-name-alist = #standard-alteration-glyph-name-alist
  }
}