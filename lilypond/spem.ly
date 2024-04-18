\version "2.24.3" 

\paper {
  % #(set-paper-size "a2")
  % top-margin = 0.5\cm
  % left-margin = 0
  % indent = 0
  % ragged-right = ##t
  % print-page-number = ##f
  % #(set-paper-size '(cons (* 5500 mm) (* 110 mm)))
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

% choir 4

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
    % \remove Clef_engraver
  }

  % \context { 
  % \Score 
  %   barNumberVisibility = #all-bar-numbers-visible 
  %   \override BarNumber.break-visibility = #all-visible 
  %   % barNumberVisibility = #(modulo-bar-number-visible 2 0) % or 2 1 to see the odd bar numbers 
  % } 

}

% choir 3

% \score {
%   <<
%     \override Score.BarNumber.break-visibility = ##(#f #t #t)
%     \time 4/2
%     \context Staff=choirIIISoprano \cIIIs
%     \context Staff=choirIIIAlto \cIIIa
%     \context Staff=choirIIITenor \cIIIt
%     \context Staff=choirIIIBaritone \cIIIbar
%     \context Staff=choirIIIBass \cIIIb
%   >>

%   \layout {
%   clip-regions = #(list
%     (cons (make-rhythmic-location 1 0 1) (make-rhythmic-location 139 0 1))
%   )
%   \context {
%     \Staff
%     \consists Ambitus_engraver
%     % \remove Clef_engraver
%   }
% }

% choir 2

% \score {
%   % \compressMMRests
%   <<
%     \override Score.BarNumber.break-visibility = ##(#f #t #t)
%     \time 4/2
%     \context Staff=choirIISoprano \cIIs
%     \context Staff=choirIIAlto \cIIa
%     \context Staff=choirIITenor \cIIt
%     \context Staff=choirIIBaritone \cIIbar
%     \context Staff=choirIIBass \cIIb
%   >>

%   \layout {
%   clip-regions = #(list
%     (cons (make-rhythmic-location 1 0 1) (make-rhythmic-location 139 0 1))
%   )
%   \context {
%     \Staff
%     \consists Ambitus_engraver
%     % \remove Clef_engraver
%   }
%   % \context { 
%   % \Score 
%   %   barNumberVisibility = #all-bar-numbers-visible 
%   %   \override BarNumber.break-visibility = #all-visible 
%   %   % barNumberVisibility = #(modulo-bar-number-visible 2 0) % or 2 1 to see the odd bar numbers 
%   % } 
% }

% choir 1

% \score {
%   % \compressMMRests
%   <<
%     \override Score.BarNumber.break-visibility = ##(#f #t #t)
%     \time 4/2
%     \context Staff=choirISoprano \cIs
%     \context Staff=choirIAlto \cIa
%     \context Staff=choirITenor \cIt
%     \context Staff=choirIBaritone \cIbar
%     \context Staff=choirIBass \cIb
%   >>

%   \layout {
%   clip-regions = #(list
%     (cons (make-rhythmic-location 1 0 1) (make-rhythmic-location 139 0 1))
%   )
%   \context {
%     \Staff
%     \consists Ambitus_engraver
%   }
% }

}