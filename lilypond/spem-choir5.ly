\version "2.24.3" 

% \include "spem layout.ly"
\include "spem notes.ly"
\include "spem words.ly"

cVs = <<
  \clef "treble"
  \context Voice=choirVSoprano \choirVSoprano
  \new Lyrics \lyricsto choirVSoprano { \underlayVs }
>>
cVa = <<
  \clef "treble"
  \context Voice=choirVAlto \choirVAlto
  \new Lyrics \lyricsto choirVAlto { \underlayVa }
>>
cVt = <<
  \clef "treble_8"
  \context Voice=choirVTenor \choirVTenor
  \new Lyrics \lyricsto choirVTenor { \underlayVt }
>>
cVbar = <<
  \clef bass
  \context Voice=choirVBaritone \choirVBaritone
  \new Lyrics \lyricsto choirVBaritone { \underlayVbar }
>>
cVb = <<
  \clef bass
  \context Voice=choirVBass \choirVBass
  \new Lyrics \lyricsto choirVBass { \underlayVb }

>>

\score {
  % \compressMMRests
  <<
    \override Score.BarNumber.break-visibility = ##(#f #t #t)
    \time 4/2
    % \context Staff=choirVSoprano \cVs
    % \context Staff=choirVAlto \cVa
    \context Staff=choirVTenor \cVt
    % \context Staff=choirVBaritone \cVbar
    % \context Staff=choirVBass \cVb
  >>

  \layout {
    clip-regions = #(list
      (cons (make-rhythmic-location 1 0 1) (make-rhythmic-location 139 0 1))
    )
    \context {
      \Staff
      \consists Ambitus_engraver
    }
  }

}