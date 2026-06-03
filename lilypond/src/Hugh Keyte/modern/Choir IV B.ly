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
      { \clef "treble" \notesIVBSoprano }
      \addlyrics \wordsIVBSoprano
    >>
    <<
      \new Voice \with {
          \remove Note_heads_engraver
          \consists Completion_heads_engraver
      }
      { \clef "treble" \notesIVBAlto }
      \addlyrics \wordsIVBAlto
    >>
    <<
      \new Voice \with {
          \remove Note_heads_engraver
          \consists Completion_heads_engraver
      }
      { \clef "treble_8" \notesIVBTenor }
      \addlyrics \wordsIVBTenor
    >>
    <<
      \new Voice \with {
          \remove Note_heads_engraver
          \consists Completion_heads_engraver
      }
      { \clef "treble_8" \notesIVBBaritone }
      \addlyrics \wordsIVBBaritone
    >>
    <<
      \new Voice \with {
          \remove Note_heads_engraver
          \consists Completion_heads_engraver
      }
      { \clef "bass" \notesIVBBass }
      \addlyrics \wordsIVBBass
    >>
  >>
}