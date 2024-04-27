\version "2.24.3" 

\include "spem layout.ly"
\include "../spem notes.ly"
\include "../spem words.ly"

\score {
  <<
    \time 4/2
    \override Score.BarNumber.break-visibility = ##(#f #t #t)
    <<
      \new Voice \with {
          \remove Note_heads_engraver
          \consists Completion_heads_engraver
      }
      { \clef "treble" \notesIIISoprano }
      \addlyrics \wordsIIISoprano
    >>
    <<
     \new Voice \with {
          \remove Note_heads_engraver
          \consists Completion_heads_engraver
      }
      { \clef "treble" \notesIIIAlto }
      \addlyrics \wordsIIIAlto
    >>
    <<
     \new Voice \with {
          \remove Note_heads_engraver
          \consists Completion_heads_engraver
      }
      { \clef "treble_8" \notesIIITenor }
      \addlyrics \wordsIIITenor
    >>
    <<
     \new Voice \with {
          \remove Note_heads_engraver
          \consists Completion_heads_engraver
      }
      { \clef "bass" \notesIIIBaritone }
      \addlyrics \wordsIIIBaritone
    >>
    <<
     \new Voice \with {
          \remove Note_heads_engraver
          \consists Completion_heads_engraver
      }
      { \clef "bass" \notesIIIBass }
      \addlyrics \wordsIIIBass
    >>
  >>
}