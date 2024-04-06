\version "2.24.3"

\include "spem notes.ly"
\include "spem words.ly"

cIs = <<
  \clef "treble"
  \context Voice=choirISoprano \choirISoprano
  \new Lyrics \lyricsto choirISoprano { \underlayIs }
>>
cIa = <<
  \clef "treble"
  \context Voice=choirIAlto \choirIAlto
  \new Lyrics \lyricsto choirIAlto { \underlayIa }
>>
cIt = <<
  \clef "treble_8"
  \context Voice=choirITenor \choirITenor
  \new Lyrics \lyricsto choirITenor { \underlayIt }
>>
cIbar = <<
  \clef bass
  \context Voice=choirIBaritone \choirIBaritone
  \new Lyrics \lyricsto choirIBaritone { \underlayIbar }
>>
cIb = <<
  \clef bass
  \context Voice=choirIBass \choirIBass
  \new Lyrics \lyricsto choirIBass { \underlayIb }

>>


\score {
  <<
    \time 4/2
    \context Staff=choirISoprano \cIs
    \context Staff=choirIAlto \cIa
    \context Staff=choirITenor \cIt
    \context Staff=choirIBaritone \cIbar
    \context Staff=choirIBass \cIb
  >>
}