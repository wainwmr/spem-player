\version "2.26.0"

leadMark = \markup {
  \with-dimensions #'(0 . 0) #'(0 . 0)
  \with-color #black % not red any more
  \path #0.2 #'((moveto 0 0)(lineto 0 1)
     (lineto 1 1))
}

ficta = { 
  \once \set suggestAccidentals = ##t 
}

\header {
  title = "Spem in alium nunquam habui"
  composer = "Thomas Tallis (c. 1505-1585)"
  edition = "VERSION A 2020 © Hugh Keyte 2020"
  tagline = \markup { \fill-line { \fromproperty #'header:edition } }
}


emphasize = {
  \override Lyrics.LyricText.font-series = #'normal % not bold any more
  \override Lyrics.LyricText.color = #black % not red any more
}

normal = {
  \revert Lyrics.LyricText.color
  \revert Lyrics.LyricText.font-series
}
