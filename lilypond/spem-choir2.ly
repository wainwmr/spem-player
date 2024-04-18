\version "2.24.3" 

\include "spem layout.ly"
\include "spem notes.ly"
\include "spem words.ly"

cIIs = <<
  \clef "treble"
  \context Voice=choirIISoprano \choirIISoprano
  \new Lyrics \lyricsto choirIISoprano { \underlayIIs }
>>
cIIa = <<
  \clef "treble"
  \context Voice=choirIIAlto \choirIIAlto
  \new Lyrics \lyricsto choirIIAlto { \underlayIIa }
>>
cIIt = <<
  \clef "treble_8"
  \context Voice=choirIITenor \choirIITenor
  \new Lyrics \lyricsto choirIITenor { \underlayIIt }
>>
cIIbar = <<
  \clef bass
  \context Voice=choirIIBaritone \choirIIBaritone
  \new Lyrics \lyricsto choirIIBaritone { \underlayIIbar }
>>
cIIb = <<
  \clef bass
  \context Voice=choirIIBass \choirIIBass
  \new Lyrics \lyricsto choirIIBass { \underlayIIb }

>>

\score {
  % \compressMMRests
  <<
    \override Score.BarNumber.break-visibility = ##(#f #t #t)
    \time 4/2
    \context Staff=choirIISoprano \cIIs
    \context Staff=choirIIAlto \cIIa
    \context Staff=choirIITenor \cIIt
    \context Staff=choirIIBaritone \cIIbar
    \context Staff=choirIIBass \cIIb
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