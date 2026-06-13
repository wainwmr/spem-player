\version "2.26.0"

\pointAndClickOn

\paper {

  page-breaking = #ly:one-line-breaking
  paper-height = 111\mm
  top-margin = 0
  bottom-margin = 0
  left-margin = 0
  right-margin = 0
}

\header { tagline = ##f }

shiftFirstNote = { \once \override NoteColumn.X-offset = #2 }

\layout {
  \context {
    \Staff
    \override VerticalAxisGroup
              .default-staff-staff-spacing
              .basic-distance = #15
    \override VerticalAxisGroup
              .default-staff-staff-spacing
              .minimum-distance = #15
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
