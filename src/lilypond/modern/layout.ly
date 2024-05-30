\version "2.24.3"

\pointAndClickOff

\paper {

  page-breaking = #ly:one-line-breaking
  paper-height = 110\mm
  top-margin = 0
  bottom-margin = 0
  left-margin = 0
  right-margin = 0
}

\header { tagline = ##f }

\layout {
  \context {
    \Staff
    \consists Ambitus_engraver
    \override VerticalAxisGroup
              .default-staff-staff-spacing
              .basic-distance = #15
  }
  \context {
    \Score
    \override SpacingSpanner.base-shortest-duration = #(ly:make-moment 1/16)
  }

  \context {
    \Voice
    \remove Note_heads_engraver
    \consists Completion_heads_engraver
  }
}
