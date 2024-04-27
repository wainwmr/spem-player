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
      { \clef "treble" \notesVISoprano }
      \addlyrics \wordsVISoprano
    >>
    <<
      \new Voice \with {
          \remove Note_heads_engraver
          \consists Completion_heads_engraver
      }
      { \clef "treble" \notesVIAlto }
      \addlyrics \wordsVIAlto
    >>
    <<
      \new Voice \with {
          \remove Note_heads_engraver
          \consists Completion_heads_engraver
      }
      { \clef "treble_8" \notesVITenor }
      \addlyrics \wordsVITenor
    >>
    <<
      \new Voice \with {
          \remove Note_heads_engraver
          \consists Completion_heads_engraver
      }
      { \clef "bass" \notesVIBaritone }
      \addlyrics \wordsVIBaritone
    >>
    <<
      \new Voice \with {
          \remove Note_heads_engraver
          \consists Completion_heads_engraver
      }
      { \clef "bass" \notesVIBass }
      \addlyrics \wordsVIBass
    >>
  >>
}