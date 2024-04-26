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
          \notesVIIISoprano
        }
        \addlyrics { \wordsVIIISoprano }
      >>
      <<
        \new Voice {
          \clef "mensural-c2"  
          \notesVIIIAlto
        }
        \addlyrics \wordsVIIIAlto
      >>
      <<
        \new Voice {
          \clef "mensural-c3"  
          \notesVIIITenor
        }
        \addlyrics \wordsVIIITenor
      >>
      <<
        \new Voice {
          \clef "mensural-f"
          \notesVIIIBaritone
        }
        \addlyrics \wordsVIIIBaritone
      >>
      <<
        \new Voice {
          \clef "mensural-f"
          \notesVIIIBass
        }
        \addlyrics \wordsVIIIBass
      >>
    >>
  >>
  \layout {
    \override Staff.Accidental.alteration-glyph-name-alist = #standard-alteration-glyph-name-alist
  }
}