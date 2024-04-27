\version "2.24.3" 

% \include "spem layout.ly"
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
      { \clef "treble" \notesIISoprano }
      \addlyrics \wordsIISoprano
    >>
    <<
      \new Voice \with {
          \remove Note_heads_engraver
          \consists Completion_heads_engraver
      }
      { \clef "treble" \notesIIAlto }
      \addlyrics \wordsIIAlto
    >>
    <<
     \new Voice \with {
          \remove Note_heads_engraver
          \consists Completion_heads_engraver
      }
      { \clef "treble_8" \notesIITenor }
      \addlyrics \wordsIITenor
    >>
    <<
     \new Voice \with {
          \remove Note_heads_engraver
          \consists Completion_heads_engraver
      }
      { \clef "bass" \notesIIBaritone }
      \addlyrics \wordsIIBaritone
    >>
    <<
     \new Voice \with {
          \remove Note_heads_engraver
          \consists Completion_heads_engraver
      }
      { \clef "bass" \notesIIBass }
      \addlyrics \wordsIIBass
    >>
  >>
}