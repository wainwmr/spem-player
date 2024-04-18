\version "2.24.3" 

\include "spem layout.ly"
\include "spem notes.ly"
\include "spem words.ly"

cIIIs = <<
  \clef "treble"
  \context Voice=choirIIISoprano \choirIIISoprano
  \new Lyrics \lyricsto choirIIISoprano { \underlayIIIs }
>>
cIIIa = <<
  \clef "treble"
  \context Voice=choirIIIAlto \choirIIIAlto
  \new Lyrics \lyricsto choirIIIAlto { \underlayIIIa }
>>
cIIIt = <<
  \clef "treble_8"
  \context Voice=choirIIITenor \choirIIITenor
  \new Lyrics \lyricsto choirIIITenor { \underlayIIIt }
>>
cIIIbar = <<
  \clef bass
  \context Voice=choirIIIBaritone \choirIIIBaritone
  \new Lyrics \lyricsto choirIIIBaritone { \underlayIIIbar }
>>
cIIIb = <<
  \clef bass
  \context Voice=choirIIIBass \choirIIIBass
  \new Lyrics \lyricsto choirIIIBass { \underlayIIIb }

>>

\score {
  <<
    \override Score.BarNumber.break-visibility = ##(#f #t #t)
    \time 4/2
    \context Staff=choirIIISoprano \cIIIs
    \context Staff=choirIIIAlto \cIIIa
    \context Staff=choirIIITenor \cIIIt
    \context Staff=choirIIIBaritone \cIIIbar
    \context Staff=choirIIIBass \cIIIb
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