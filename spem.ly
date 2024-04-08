\version "2.24.3"

\paper {
  #(set-paper-size "a2")
  top-margin = 0
  % left-margin = 0
  indent = 0\cm
  print-page-number = ##f
  % #(set-paper-size '(cons (* 6000 mm) (* 100 mm)))
}

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
  \compressMMRests
  <<
    \time 4/2
    \context Staff=choirISoprano \cIs
    \context Staff=choirIAlto \cIa
    \context Staff=choirITenor \cIt
    \context Staff=choirIBaritone \cIbar
    \context Staff=choirIBass \cIb
  >>
}