\version "2.26.0"

\pointAndClickOn

\paper {
  page-breaking = #ly:one-line-breaking
  paper-height = 85\mm
  top-margin = 0
  bottom-margin = 0
  left-margin = 0
  right-margin = 0
}

\header { tagline = ##f }

shiftFirstNote = { \once \override NoteColumn.X-offset = #2 }

#(set-global-staff-size 16)

\layout {
  \context {
    \Score
    \time 4/2
    \hide BarLine 
    \override SpacingSpanner.base-shortest-duration = #(ly:make-moment 1/16)

    % \override NoteHead.style = #'baroque
    \override NoteHead.style = #'petrucci
    \override Rest.style = #'mensural
    \override Flag.style = #'mensural

    \override NoteHead.font-size = #+2
    \override Rest.font-size = #+4
    alterationGlyphs = #alteration-vaticana-glyph-name-alist
    \override Stem.thickness = 3.0
    \override Score.BarLine.transparent = ##t
    
    % increase font size of normal, ficta and cautionary accidentals
    \override Accidental.font-size = #+4
    \override AccidentalSuggestion.font-size = #+1
    \override AccidentalCautionary.font-size = #+4

    \autoBeamOff

    % \override Voice.Stem.thickness = #1.0
  }
%   \context {
%     \Voice
%     \override NoteHead.font-size = #+4
%     \override Accidental.font-size = #+4

%   }
%   \context {
%     \Lyrics
%     \consists "Bar_engraver"
%     \consists "Separating_line_group_engraver"
%   }
  \context {
    \Staff
%       \override Staff.Accidental.alteration-glyph-name-alist = #standard-alteration-glyph-name-alist
    % \override NoteHead.style = #'baroque

    \override VerticalAxisGroup
              .default-staff-staff-spacing
              .basic-distance = #13
    \override VerticalAxisGroup
              .default-staff-staff-spacing
              .minimum-distance = #13
  }
}
