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
      { \clef "treble" \notesIIIASoprano }
      \addlyrics \wordsIIIASoprano
    >>
    <<
      \new Voice \with {
          \remove Note_heads_engraver
          \consists Completion_heads_engraver
      }
      { \clef "treble" \notesIIIAAlto }
      \addlyrics \wordsIIIAAlto
    >>
    <<
      \new Voice \with {
          \remove Note_heads_engraver
          \consists Completion_heads_engraver
      }
      { \clef "treble_8" \notesIIIATenor }
      \addlyrics \wordsIIIATenor
    >>
    <<
      \new Voice \with {
          \remove Note_heads_engraver
          \consists Completion_heads_engraver
      }
      { \clef "treble_8" \notesIIIABaritone }
      \addlyrics \wordsIIIABaritone
    >>
    <<
      \new Voice \with {
          \remove Note_heads_engraver
          \consists Completion_heads_engraver
      }
      { \clef "bass" \notesIIIABass }
      \addlyrics \wordsIIIABass
    >>
  >>
}