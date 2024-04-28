\version "2.24.3" 

\include "spem layout.ly"
\include "../spem notes.ly"
\include "../spem words.ly"

\score {

  <<
      \override Score.BarNumber.break-visibility = ##(#f #t #t)
      <<
        \new Voice {
          \clef "mensural-c1"  
          \notesIIISoprano
        }
        \addlyrics { \wordsIIISoprano }
      >>
      <<
        \new Voice {
          \clef "mensural-c2"  
          \notesIIIAlto
        }
        \addlyrics \wordsIIIAlto
      >>
      <<
        \new Voice {
          \clef "mensural-c3"  
          \notesIIITenor
        }
        \addlyrics \wordsIIITenor
      >>
      <<
        \new Voice {
          \clef "mensural-f"
          \notesIIIBaritone
        }
        \addlyrics \wordsIIIBaritone
      >>
      <<
        \new Voice {
          \clef "mensural-f"
          \notesIIIBass
        }
        \addlyrics \wordsIIIBass
      >>
    >>
  \layout {
    \override Staff.Accidental.alteration-glyph-name-alist = #standard-alteration-glyph-name-alist
  }
}