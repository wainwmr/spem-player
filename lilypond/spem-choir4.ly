\version "2.24.3" 

\include "spem layout.ly"
\include "spem notes.ly"
\include "spem words.ly"

cIVs = <<
  \clef "treble"
  \context Voice=choirIVSoprano \choirIVSoprano
  \new Lyrics \lyricsto choirIVSoprano { \underlayIVs }
>>
cIVa = <<
  \clef "treble"
  \context Voice=choirIVAlto \choirIVAlto
  \new Lyrics \lyricsto choirIVAlto { \underlayIVa }
>>
cIVt = <<
  \clef "treble_8"
  \context Voice=choirIVTenor \choirIVTenor
  \new Lyrics \lyricsto choirIVTenor { \underlayIVt }
>>
cIVbar = <<
  \clef bass
  \context Voice=choirIVBaritone \choirIVBaritone
  \new Lyrics \lyricsto choirIVBaritone { \underlayIVbar }
>>
cIVb = <<
  \clef bass
  \context Voice=choirIVBass \choirIVBass
  \new Lyrics \lyricsto choirIVBass { \underlayIVb }

>>

\score {
  % \compressMMRests
  <<
    \override Score.BarNumber.break-visibility = ##(#f #t #t)
    \time 4/2
    \context Staff=choirIVSoprano \cIVs
    \context Staff=choirIVAlto \cIVa
    \context Staff=choirIVTenor \cIVt
    \context Staff=choirIVBaritone \cIVbar
    \context Staff=choirIVBass \cIVb
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