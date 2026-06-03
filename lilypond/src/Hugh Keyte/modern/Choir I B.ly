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
      { \clef "treble" \notesIBSoprano }
      \addlyrics \wordsIBSoprano
    >>
    <<
      \new Voice \with {
          \remove Note_heads_engraver
          \consists Completion_heads_engraver
      }
      { \clef "treble" \notesIBAlto }
      \addlyrics \wordsIBAlto
    >>
    <<
     \new Voice \with {
          \remove Note_heads_engraver
          \consists Completion_heads_engraver
      }
      { \clef "treble_8" \notesIBTenor }
      \addlyrics \wordsIBTenor
    >>
    <<
     \new Voice \with {
          \remove Note_heads_engraver
          \consists Completion_heads_engraver
      }
      { \clef "treble_8" \notesIBBaritone }
      \addlyrics \wordsIBBaritone
    >>
    <<
     \new Voice \with {
          \remove Note_heads_engraver
          \consists Completion_heads_engraver
      }
      { \clef "bass" \notesIBBass }
      \addlyrics \wordsIBBass
    >>
  >>
}