\version "2.26.0" 

\include "layout.ly"
\include "../spem.ly"
\include "../spem words.ly"

\score {
  <<
    \time 4/2
    \override Score.BarNumber.break-visibility = ##(#f #t #t)
    \override Score.BarNumber.font-size = #1
    <<
      \new Voice \with {
          \remove Note_heads_engraver
          \consists Completion_heads_engraver
      }
      { \clef "treble" \notesIIASoprano }
      \addlyrics \wordsIIASoprano
    >>
    <<
     \new Voice \with {
          \remove Note_heads_engraver
          \consists Completion_heads_engraver
      }
      { \clef "treble" \notesIIAAlto }
      \addlyrics \wordsIIAAlto
    >>
    <<
     \new Voice \with {
          \remove Note_heads_engraver
          \consists Completion_heads_engraver
      }
      { \clef "treble_8" \notesIIATenor }
      \addlyrics \wordsIIATenor
    >>
    <<
     \new Voice \with {
          \remove Note_heads_engraver
          \consists Completion_heads_engraver
      }
      { \clef "treble_8" \notesIIABaritone }
      \addlyrics \wordsIIABaritone
    >>
    <<
     \new Voice \with {
          \remove Note_heads_engraver
          \consists Completion_heads_engraver
      }
      { \clef "bass" \notesIIABass }
      \addlyrics \wordsIIABass
    >>
  >>
}