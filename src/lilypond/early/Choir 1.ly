\version "2.24.3" 

\include "layout.ly"
\include "../spem.ly"
\include "../spem words.ly"

\score {

  <<
    % \new StaffGroup = choirStaff <<
      \override Score.BarNumber.break-visibility = ##(#f #t #t)
      <<
        \new Voice {
          \clef "mensural-c1"  
          \notesISoprano
        }
        \addlyrics { \wordsISoprano }
      >>
      <<
        \new Voice {
          \clef "mensural-c2"  
          \notesIAlto
        }
        \addlyrics \wordsIAlto
      >>
      <<
        \new Voice {
          \clef "mensural-c3"  
          \notesITenor
        }
        \addlyrics \wordsITenor
      >>
      <<
        \new Voice {
          \clef "mensural-f"
          \notesIBaritone
        }
        \addlyrics \wordsIBaritone
      >>
      <<
        \new Voice {
          \clef "mensural-f"
          \notesIBass
        }
        \addlyrics \wordsIBass
      >>
    >>
  % >>
  \layout {
    \override Staff.Accidental.alteration-glyph-name-alist = #standard-alteration-glyph-name-alist
  }
}