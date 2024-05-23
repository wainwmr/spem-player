\version "2.24.3" 

\include "spem layout.ly"
\include "../spem.ly"
\include "../spem words.ly"

\score {

  <<
      \override Score.BarNumber.break-visibility = ##(#f #t #t)
      <<
        \new Voice {
          \clef "mensural-c1"  
          \notesIISoprano
        }
        \addlyrics { \wordsIISoprano }
      >>
      <<
        \new Voice {
          \clef "mensural-c2"  
          \notesIIAlto
        }
        \addlyrics \wordsIIAlto
      >>
      <<
        \new Voice {
          \clef "mensural-c3"  
          \notesIITenor
        }
        \addlyrics \wordsIITenor
      >>
      <<
        \new Voice {
          \clef "mensural-f"
          \notesIIBaritone
        }
        \addlyrics \wordsIIBaritone
      >>
      <<
        \new Voice {
          \clef "mensural-f"
          \notesIIBass
        }
        \addlyrics \wordsIIBass
      >>
    >>
  \layout {
    \override Staff.Accidental.alteration-glyph-name-alist = #standard-alteration-glyph-name-alist
  }
}