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
          \notesVIISoprano
        }
        \addlyrics { \wordsVIISoprano }
      >>
      <<
        \new Voice {
          \clef "mensural-c2"  
          \notesVIIAlto
        }
        \addlyrics \wordsVIIAlto
      >>
      <<
        \new Voice {
          \clef "mensural-c3"  
          \notesVIITenor
        }
        \addlyrics \wordsVIITenor
      >>
      <<
        \new Voice {
          \clef "mensural-f"
          \notesVIIBaritone
        }
        \addlyrics \wordsVIIBaritone
      >>
      <<
        \new Voice {
          \clef "mensural-f"
          \notesVIIBass
        }
        \addlyrics \wordsVIIBass
      >>
    >>
  >>
  \layout {
    \override Staff.Accidental.alteration-glyph-name-alist = #standard-alteration-glyph-name-alist
  }
}