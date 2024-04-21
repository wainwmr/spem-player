\version "2.24.3" 

% \include "spem layout.ly"
\include "spem notes.ly"
\include "spem words.ly"

\score {

  <<
    \time 4/2
    \override Score.BarNumber.break-visibility = ##(#f #t #t)
    % <<
    %   \notesVIISoprano
    %   \addlyrics \wordsVIISoprano
    % >>
    % <<
    %   \notesVIIAlto
    %   \addlyrics \wordsVIIAlto
    % >>
    <<
      \notesVIITenor
      \addlyrics \wordsVIITenor
    >>
    % <<
    %   \notesVIIBaritone
    %   \addlyrics \wordsVIIBaritone
    % >>
    % <<
    %   \notesVIIBass
    %   \addlyrics \wordsVIIBass
    % >>
  >>
}