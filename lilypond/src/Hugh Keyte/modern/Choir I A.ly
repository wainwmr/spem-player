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
      { \clef "treble" \shiftFirstNote \notesIASoprano }
      \addlyrics \wordsIASoprano
    >>
    <<
      \new Voice \with {
          \remove Note_heads_engraver
          \consists Completion_heads_engraver
      }
      { \clef "treble" \shiftFirstNote \notesIAAlto }
      \addlyrics \wordsIAAlto
    >>
    <<
      \new Voice \with {
          \remove Note_heads_engraver
          \consists Completion_heads_engraver
      }
      { \clef "treble_8" \shiftFirstNote \notesIATenor }
      \addlyrics \wordsIATenor
    >>
    <<
      \new Voice \with {
          \remove Note_heads_engraver
          \consists Completion_heads_engraver
      }
      { \clef "treble_8" \shiftFirstNote \notesIABaritone }
      \addlyrics \wordsIABaritone
    >>
    <<
      \new Voice \with {
          \remove Note_heads_engraver
          \consists Completion_heads_engraver
      }
      { \clef "bass" \shiftFirstNote \notesIABass }
      \addlyrics \wordsIABass
    >>
  >>
}