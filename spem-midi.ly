% Lily was here -- automatically converted by midi2ly from spem-midi.midi
\version "2.14.0"

\layout {
  \context {
    \Voice
    \remove Note_heads_engraver
    \consists Completion_heads_engraver
    \remove Rest_engraver
    \consists Completion_rest_engraver
  }
}

channelA = {


  \key a \minor
    
  % [TEXT_EVENT] creator: 
  
  % [TEXT_EVENT] LilyPond 2.24.3               
  
  \time 4/2 
  
  \tempo 4 = 132 
  \skip 1*274 
  \time 12/4 
  \skip 1*3 
  | % 139
  
}

trackA = <<
  \context Voice = voiceA \channelA
>>


choirISopranoX = {
  
  \set Staff.instrumentName = "Choir 1 Soprano"
  

  \key a \minor
  \skip 1*277 
}

choirISoprano = \relative c {
  r1 d''1. d2 
  | % 2
  d d a c c e2. d4 d1 c2 b2. a4 g2 d g a2. a4 d,2 r2 
  | % 5
  d'2. c4 c1 f,2 c'4. b8 
  | % 6
  a4 g f2 f'2. e4 d2. a2 d d, a' e4 r4 g c2 g' f4. e8 d4 c b2 
  g d'1*2 r2 d d4 d2 a4 a2 r4 f 
  | % 10
  c' e2 c4 e2 r4 a, a e'2 c4 
  | % 11
  f2 f4. e8 d4 a a1 d,2 
  | % 12
  a'2. a4 a2 r2. g2 b4 
  | % 13
  d a2 d g,4 r4 d'2 e8 fis g2. d4 d2 r1 d,2 a' r4 
  | % 15
  d b2. g4 d'2 g, c1 a2 a1 r2*59 d2 b b e,1 r2 
  | % 28
  b' e r4 e,2 e4 e2. e4 
  | % 29
  e2 r4 d g2. b2 g4 r4 d'2 g4 g1 r1*40 d1 e1. e2 
  | % 45
  e1 r2 e e d 
  | % 46
  c2. c4 b1 r2 g2. g4. e8 e4 r4 c2 g'4. e8 e2 c'4. c8 
  | % 48
  c4 r4 e2 e4. f8 g4 r4 c, f, c'4. a8 
  | % 49
  a2 g8 f g2 r4 g2 g4 d'2 r2 d d4. d8 d4 d r2 g,1 
  | % 51
  f2 r4 g d'2 r2*17 c2 f2. f4 e d d2 c4 a2 g8 f e2 r4 a4. b8 
  c d e4 a,2 d4 d2 r1. e2 d1 
  | % 57
  d2 d4 g2 f8 e d4. c8 b1 
  | % 58
  r2*15 c2. c4 e2 f e r1. d2 e d r2 d e 
  | % 63
  d c b r4*51 g'4 f2 e r2. g4 f f e2 d r1. a4 d2 cis4 
  | % 70
  d2 r1 e2 b4 d g, c 
  | % 71
  b2 g r2. g4 g4. a8 b c d4 
  | % 72
  g,1 r2 e'1 e2 
  | % 73
  e1*2 r2*29 d2 d d g2. f4 e2 
  | % 79
  d c b a d2. c4 
  | % 80
  b g a1 r1 b1. b2 b r4 g2 b4 b2 r2*5 c1 c4 c f1 c r4 a2 f4. 
  d8 d'2. d2 r2. ais f'2 f,4 a2 d, g4 g1 r1. d'2. b4 b2 
  | % 88
  b4 d2 b4 r2. c4. g8 g4. d8 d4 
  | % 89
  r2. g4 e e'2 e4 e c c2 
  | % 90
  r2. g4 d'2. g4 g2 r4 g2 d4 d2 d1*5 
}

cIs = <<
  \context Voice = voiceA \choirISopranoX
  \context Voice = voiceB \choirISoprano
>>


choirIAltoX = {
  
  \set Staff.instrumentName = "1a:voiceA"
  

  \key a \minor
  \skip 1*277 
}

choirIAlto = \relative c {
  g''1. g2 g g 
  | % 2
  d f f a1 g2 
  | % 3
  f1 e d2. c4 
  | % 4
  b g b1 a2 a2. b8 c 
  | % 5
  d1 r2 g e f4 d 
  | % 6
  e2. e4 f2 a2. g4 f e 
  | % 7
  d2 a r4 a'2 a4 a a e g2 g4 g1 fis2 g b b b2. a4 g2 r2. a2 a4 
  | % 10
  a2 a4 d,2 a'4 a c2 g4 g2 
  | % 11
  r2 e e4 a2 d,4 f2 f4. g8 
  | % 12
  a4 f2 d4 d2. a4 d a a2 
  | % 13
  r1 d2 a d r2 
  | % 14
  d4 g2 d4 d2. d4 a2 r1 a4 d4. e8 f4 r4 d2 g,4 g'2. g4 
  | % 16
  g1 r2*63 d2 d4 g g2 r4 g2 e4 g c, 
  | % 28
  r4 g'4. e8 e4. f8 g4 r2. c,4 e g2 g4 r4 d d g2 g4 g2 r2. 
  | % 30
  d4. b8 b2 g4 d'1 r1*39 d1 c2. d4 e f g2 
  | % 45
  r2 c, g' g a2. a4 
  | % 46
  g1. g2. a4 b2 
  | % 47
  c1. g2 g r4 g 
  | % 48
  g2 g4 c4. c8 c4 c, e f a4. a8 f4 
  | % 49
  r2 e4 e2 e4 r2 g4. g8 g2 
  | % 50
  r2 b b4. b8 b4 b r4 g g2 
  | % 51
  r2*21 a2 a a b b c1 c2 a a1 a 
  | % 56
  r1. c2 a1 
  | % 57
  b2 g1 fis2 g1 
  | % 58
  r2*15 a2. a4 a2 a a r1. g2 g g r2 g g 
  | % 63
  g4 g2 g, d'4 r4 e g2 r4*37 b4 c g r4 d g c, r4 g'2 c4 f, 
  | % 68
  a g c, c2 r4 c c c e2 a, r1. a'4 a4. g8 e4 r4 a 
  | % 70
  e a,2 a'4 a e g2 g r4 g 
  | % 71
  g c, g'2 r2. g4 g2. c4 
  | % 72
  c2 r2 a1 a2 a1*2 r1*14 d,2 d d g2. f4 e2 
  | % 79
  r2 d g, d'4. e8 f4 g a2 
  | % 80
  d,1*2 r1 
  | % 81
  d1. d2 d1*2 r1*2 a'2 a 
  | % 84
  a c1 a4 f f1 
  | % 85
  r2 f2. ais,4 ais'2 ais r4 ais,2. ais2 r4 d a2 a r2 c4 g'2 c,4. 
  a8 a'4 a2 r1. g2 g4 g4. a8 b4 r2. e, b2 
  | % 89
  r2 c2. e4 c g' g1 
  | % 90
  r2 b,2. b4 b2 b4 d2 d4 
  | % 91
  r2 g1 d2 d1*4 
}

cIa = <<
  \context Voice = voiceA \choirIAltoX
  \context Voice = voiceB \choirIAlto
>>


choirITenorX = {
  
  \set Staff.instrumentName = "1t:voiceA"
  

  \key a \minor
  \skip 1*277 
}

choirITenor = \relative c {
  r1*9 d'1. d2 d d 
  | % 5
  a a c e2. d4 d1 cis2 d a r2 d f1. d2 e2. d4 c2 b a1 g r2 g 
  d' d, 
  | % 9
  d1 r2 d d4 a'2 f4 
  | % 10
  a a e2 r4 e f a2 e4 e'2 
  | % 11
  r2 a, d4 f4. f8 e4 d2 r4 d,2 a' f4 r4 c' c4. d8 e2 r1 d2 d4 
  g2 g,4 d'4. c8 b2 g4 d'2 a4 r1 d4 f4. e8 d2 d4. c8 
  | % 15
  b4 b4. a8 g2 g1 r2*63 b2 b4 b b2 r2 e, e 
  | % 28
  r2 g4 g g2 r2 e e' 
  | % 29
  e b4 d g, b2 b4 b2 r2. d,4 g b g d' d b d2 r1*39 g,1 g2 e e1 
  | % 45
  r2 c' c c c4 c a2 
  | % 46
  r1*2 d1 
  | % 47
  e2. e4 e1 g2 e 
  | % 48
  c g'2. c,4 c2 r2. c4 
  | % 49
  c2 c4 c4. g8 g4 r2 d'4. g,8 g2 
  | % 50
  r2 g' g g4 g4. f8 e4. d8 c4 
  | % 51
  r2*21 c2 a a4 d4. c8 b4. a8 g4 r4 c 
  | % 55
  a e'2. a,2 r4 a8 b cis d e4 f d 
  | % 56
  d2 r1. c2 f4. e8 
  | % 57
  d4. c8 b2 r2 a4 d2 a4 r4 d 
  | % 58
  b g g2 r1*7 e'2. e4 e2 r4 a,2 e'4 e2 
  | % 62
  r1 d2 g d r2 
  | % 63
  d g d4 g,2 g'4 g2 r4*41 d4 c2 b r4 e d d c2 a4 
  | % 68
  f c'2 r2. e4 f f g2 d r4*7 f4 e2 d 
  | % 70
  r2. f4 e e d2 c r4 b 
  | % 71
  e2 d4 c2 b4 e2 d c1 r2 cis1 cis2 cis1 
  | % 73
  r2*33 d2 e c g'2. f4 e2 
  | % 80
  d2. c4 b a g2 r4 d2 fis4 
  | % 81
  fis2 r1 g2. b2 g d' g,4 b2 b1 r1. c2 c c4 f2 c4 r4 c a f 
  | % 84
  c'2 r4 a a2 a4 c2. f,4 f'2. f2 r4 d2 g,4 g2 r4 d2. 
  | % 86
  d1 r4*5 d'2. 
  | % 87
  d2 r1 d2 d d 
  | % 88
  g, g r2 g' g g 
  | % 89
  c,2. d4 e1 r2. d2 d4. c8 b4 r4 g2. g1 r2 b b1*4 
}

cIt = <<

  \clef bass
  
  \context Voice = voiceA \choirITenorX
  \context Voice = voiceB \choirITenor
>>


choirIBaritoneX = {
  
  \set Staff.instrumentName = "1bar:voiceA"
  

  \key a \minor
  \skip 1*277 
}

choirIBaritone = \relative c {
  r1*8 g'1. g2 g f 
  | % 4
  d f f a1 g f2 e1 d a'2 
  | % 6
  d, a'1 r2 d, a'4 c2 c,4. d8 e c d2 r4 d a' d4. c8 b2 
  | % 8
  g4 b2. d2 g,4 r4 d' b2 a1 d,2 d'2. d,4 e2 c r2 
  | % 11
  a' c1 r2 f,2. f2 a d,4 a' d2 c8 b a2 r2 c4 
  | % 13
  c,2 g' d4 r4 d' d2. d,4 g 
  | % 14
  d d1 r1 g2 c r4 f, a2 r4 d,2 d'4 d1 
  | % 16
  r2*65 g,2 g4 b b2 r4 g c, g'2 c4 
  | % 28
  r2 c2. g4 g1 r2 
  | % 29
  g g1 r2 g g4. a8 
  | % 30
  b4. c8 d2. b4 b1 r1*39 g1 g1. g2 
  | % 45
  g1 r1*4 g1 g2 g c,4 e2 g4 
  | % 47
  g c2 c4 c1 r2 c,4 c2 c4 r4 a'2 a4 a2 r1 b4. b8 b2 r2 g g2. 
  g4 g2 g d'1 g,2 r1*9 a2 d, f g g a1 g2 f e1 d 
  | % 56
  r1. a'2 a d, 
  | % 57
  d r1 d2 d1. g2 g r1*6 c2. c4 a2 a a r1. g2 g g r2 g g 
  | % 63
  g g g r2*21 e4 g2 d4 r2 d4 g2 c,4 f2 
  | % 68
  c r2. c4 f f c2 f 
  | % 69
  r1. d4 a'4. e8 a4 a2 
  | % 70
  r2. a4 c c b2 e,4 g2 d4 
  | % 71
  r4 g g e2 g4. f8 e4 r4 g2 c,4 
  | % 72
  g'2 r2 e1 e2 e1*2 r2*33 g2 g d g1 a b a r1 
  | % 81
  g2. f8 e d2 b b1*2 r1. c2 c4 f2 a f4 f2 c'1 a2 c r2 f, f4 ais2 
  d d4 ais4. a8 g4 d2 g4 r2. f4 f2 r4 g4. c,8 e4 r2. d4 d2 r2 d' 
  b b g d r1. d4 g2 e e4 e4. f8 g2 r4 c2 c4 r4 b2 
  | % 90
  g4 g2 r4 g2 d'4. g,8 b4. c8 d4 d, 
  | % 91
  g4. a8 b2 g4 g1*4 
}

cIbar = <<

  \clef bass
  
  \context Voice = voiceA \choirIBaritoneX
  \context Voice = voiceB \choirIBaritone
>>


choirIBassX = {
  
  \set Staff.instrumentName = "1b:voiceA"
  

  \key a \minor
  \skip 1*277 
}

choirIBass = \relative c {
  r2*21 d1 d2 d d a 
  | % 5
  c1 d2 a a d1 f1. d2 f1 
  | % 7
  e2 c4 g' e4. f8 g2 r2 d 
  | % 8
  d g1 d2 d2. g,4 
  | % 9
  g2 r4 d' a'2. a4 d,1 
  | % 10
  r1. d2 e a2. a4 d,1 a'2 a a2. 
  | % 12
  a4 d,2 r2 g e r4 d d 
  | % 13
  a'2 d,4 r4 g g2. g,4 d' g, d'2 r4*7 a'2 d, g f8 e d2 g, r2 c4 
  c c1*2 r2*59 d2 d g,4 g'2 c,4 e2. g4. g8 d4 r4 g2 e4. f8 g2 c, 
  g'4 g2 r4 g2 d g,4 d'1 g2 
  | % 30
  g1*2 r1*47 g2 g2. c,4 c e e2 c 
  | % 47
  r4 g'2 e c g' g4 g2 
  | % 48
  a4 a2 a4 e a, c1 c2 
  | % 49
  d1 r2 g b2. g4 
  | % 50
  g c, g'2. f4 d2 r2*21 d2 g, b a2. a4 c2 
  | % 55
  f,4 f a1 d r1. a2 d1 g,2 r4 d' f2 
  | % 58
  f4. e8 d4 g, g2 r4*105 g'4 g2 g r4 g g g e2 d r4*19 d4 a'2 
  d, r2. a'4 a a d,2 e4 c g'2 c, g4 c2 g4 c2 
  | % 72
  g c1 r2 e1 
  | % 73
  a2 a,2. b4 c a e'2 r1*23 g1. d2 g1*2 r1*2 c,2 c 
  | % 83
  c4 c2 f2. c2 r2 f 
  | % 84
  f a ais f r2 d 
  | % 85
  ais d r2 f d ais 
  | % 86
  r2 g' f4 a2 d,4 d1 
  | % 87
  r1. g2 g g 
  | % 88
  g4. a8 b2 g r1 c,2 
  | % 89
  g' e r2 g g, g' 
  | % 90
  g2. f8 e d1*6 
}

cIb = <<

  \clef bass
  
  \context Voice = voiceA \choirIBassX
  \context Voice = voiceB \choirIBass
>>


choirIISopranoX = {
  
  \set Staff.instrumentName = "2s:voiceA"
  

  \key a \minor
  \skip 1*277 
}

choirIISoprano = \relative c {
  r2*29 a''1 a2 a a d, 
  | % 6
  f f a1 f2 c' 
  | % 7
  c2. g4 b g a1 r2 
  | % 8
  d d4 b2 g d'4. c8 b2 g4 
  | % 9
  a2 r4 f'2 d4 f4. f8 f2 r4 c 
  | % 10
  g c c2 r2 e2. a,2 d d4 d2 d1 d2. f4 d2 r4 e2 e4 g2 r4 d d4. 
  e8 f4 d 
  | % 14
  r4 d g, b2 b4. c8 d4 r4 d, d2 
  | % 15
  r4 g g c f, a r4 d4. b8 b2 g d'4 r4 g,2 e4 e2 r4 a c f2 
  | % 17
  c4 c2 r2*59 g'2 g g g r2 g, 
  | % 28
  g4 g2 c4 c2 r2 g4 e2 e'4. f8 g2 d g,4 b d r4 d, g d r4 g2 d'4 
  b d d1 r1*39 b1 c1. c2 
  | % 45
  c1 g2 c1 d2 
  | % 46
  e2. c4 d1 d2 g1 g2 g1 r2 g e 
  | % 48
  c e4 g2 c,4 c2 r2. a4 
  | % 49
  e'2 e4 e4. e8 e4 r4 b8 b g2 r2 
  | % 50
  g d4. d8 d4 g r4 c,4. d8 e4 r4*43 a2 d d4 b g d'4. e8 f2 e2. 
  d4 d1 cis2 d1 r1. a2 f4 a2 d, g4 b4. c8 d2 
  | % 58
  r4 d2 g f8 e d2 r1*7 e2. e4 c2 a4 f c'2 r1. b4 d c4. a8 b2 
  r2 b4 d c4. a8 
  | % 63
  b4 g g2 r2*21 b4 g2 g4 r4 b g2 r2. g4 
  | % 68
  d'2 g,4 c c2 r4 c c c c2 
  | % 69
  f, r4*7 d'4 c8 b a g 
  | % 70
  f4 d r1 a'2 d4 b c2 
  | % 71
  d r2. g4 g2 g r1*2 e2 cis1 cis r2*27 a2 a f4 g a2 d, r2 
  | % 79
  g g g c d e 
  | % 80
  g f d r2 d d1 r1 d1. d2 
  | % 82
  d1*2 r2*9 c2 c c4 f2 c4 c2 r4 f,2 ais4 ais d d2 d r2. d2 
  | % 86
  d d4 g1 c,2 r4 f4. e8 
  | % 87
  d c b1 r2 d b b e, e r2 b' e r4 e,2. e4 e e2 e r4 d g2 g4 b2 
  g4 r4 d'2 g4 g1 r4 g,2 
  | % 91
  d'4 d2 b b1*3 
}

cIIs = <<
  \context Voice = voiceA \choirIISopranoX
  \context Voice = voiceB \choirIISoprano
>>


choirIIAltoX = {
  
  \set Staff.instrumentName = "2a:voiceA"
  

  \key a \minor
  \skip 1*277 
}

choirIIAlto = \relative c {
  r1*7 g''1. g2 g g 
  | % 4
  d f f a2. g4 f2. e2 c4 c4. b8 a1 c2 a d r4 a'2 a4 a2 a4 d,2 
  f e8 d c2. b8 a g1 r1 d'2. b2 g4 d'4. c8 b1 
  | % 9
  r4 d2 a' f4 f2. f4 d2 
  | % 10
  r2 c g' d a' r1 a2 a d,2. a4 a2 r2 
  | % 12
  a'2. g8 f g2 c, r2 f 
  | % 13
  a r2 d4 b4. a8 g2 d4 d2 
  | % 14
  r4 a' e g2 e4 a2 d, r4 b 
  | % 15
  d g2 d4 d2 r2*65 b'2 b b c1 r2 
  | % 28
  b4 g2. e2 r4 g g2. c2 g4 r4 g,2 g4 g2 r4 g' b b2 
  | % 30
  b4 b1*2 r1*39 g1 g1. g2 
  | % 45
  g g e c f1 
  | % 46
  e d r1. e2 e2. e4 e2 r1 
  | % 48
  c'2 c g r4 c4. c8 c4 r4 c, 
  | % 49
  c2 c c4. g8 g1 r2 
  | % 50
  g d'4 b b d r4 g, c2 r2*21 e2 f4. g8 a2 g4 g4. f8 d4 r4 a'2 
  e4. f8 g4 r4 a c4. b8 a4. g8 f4. g8 a4 
  | % 56
  d, r1. a'2 a4. g8 fis2 g r2 d a'2. b4 g2. f8 e d2 r2*13 e4. 
  e8 a4 c4. b8 a g f4 d e2 r1. g4. f8 e4 c d2 r2 g4. f8 e4 c 
  | % 63
  d2 r2 d a r2*19 d4 g2 c,4 r2 e4 g2 d4 r4 g 
  | % 68
  d a' c2 f,4 a r4 e a a e2 
  | % 69
  a r1*2 a4 a4. g8 f4 r4 e a d, r4 a' g4. f8 e2 r2 c4 g2 g'4 
  c, g'2 c,4 r1*2 a2. cis2 a4 a1 r1*14 a'2 a a d2. c4 b a 
  | % 79
  g c, g'2. a4 b2 g r4 d2 a d g,4 r4 d'2 a'4. d,8 d4 r1 g1. g2 
  g1*2 r1*3 
  | % 84
  a2 a4 a2 c a4 a1 
  | % 85
  r1 d2. d,4 d2 r1 d f4 f4. g8 a4 ais g r4 g2 c4. b8 a g f2 r4 d 
  d2 r4 d d2 d4 g2 d4 r4 c g2. g'4 g2 
  | % 89
  r1 g4 c4. g8 g4. e4 c8 g'2 
  | % 90
  r2 g4 d'4. b8 b g g2 r4 d2 e8 f 
  | % 91
  g2. b2 g4 b4. a8 g1 
  | % 92
  g1*3 
  | % 93
  
}

cIIa = <<
  \context Voice = voiceA \choirIIAltoX
  \context Voice = voiceB \choirIIAlto
>>


choirIITenorX = {
  
  \set Staff.instrumentName = "2t:voiceA"
  

  \key a \minor
  \skip 1*277 
}

choirIITenor = \relative c {
  r2*33 d'1 d2 d d a 
  | % 7
  a c e1 d2. c4 
  | % 8
  a2 b4 g2 d'4 d2 b r2 
  | % 9
  g'2. d2 a d c8 b a2 
  | % 10
  d r2 g e4 c f2 r2 
  | % 11
  e a, f4 d a'2 d r2 
  | % 12
  f2. f4 f2 r2 e4 c2 g d' d4 a2 d4. c8 b4. a8 g1 r2 d' g,1 d'4. 
  c8 a4. c8 
  | % 15
  b1*2 r2*65 d2 d b e1 r2 
  | % 28
  d4 g, g2 r4 e' e2. e,8*5 f8 
  | % 29
  g4 e r4 g d d'2 b4 r4 g g g'2 g4. d8 g4 g2 r1*40 g,1 c1. c2 
  | % 45
  c1 r2 c a f 
  | % 46
  c'2. c4 g1 r1. c2 c c g r4 e'2 g g4 r4 e4. e8 e4 r2. c4 a e 
  r4 
  | % 49
  e'2 e4 e2 r4 d4. d8 d4 r2 d d4. d8 d4 b r4 e,2 e'4 r4 a, a2 
  | % 51
  r2*19 a2 d4. d8 d4 a r4 d2 g4. f8 e d 
  | % 55
  e4 c r4 c d8 e f d e2 e,4 a4. d,8 f4. g8 a4 r1. c2 d1. g,2 
  r4 f a2. g4 d2 r2*15 a'2. a4 c2 d c r1. b2 c b r2 b c4 c 
  | % 63
  b2 e, r4*43 b'4 g4. a8 b c d4 r4 g,8 a b c d4 e e f 
  | % 68
  d e2 r2. c4 c f, c'2 a r4*7 a4 c4. b8 a4 d 
  | % 70
  r4*5 c4 g b g4. a8 b c d4 
  | % 71
  r4 g, b g g2 r2 b4. a8 g e g4. f8 e4 r2 e'1 e2 e1*2 r2*25 a,2 
  c d4 e f2. e4 d2 
  | % 79
  g,2. a8 b c1 g2. a4 
  | % 80
  b c d e fis2 g1 fis r1 d1. d2 
  | % 82
  d1 r2 d d d4 f2 f, c' a4 r4 c2 a4 a2 r4 
  | % 84
  a2 a4. ais8 c4 f,2 r2. f2 
  | % 85
  f4 f f f2 r2 d ais'4. ais8 f4. g8 a2 r1 c4 c4. d8 e c d2 r4 d2 
  b g4 g2 g r1. c2. g2 d'4 r4 e e c c g 
  | % 89
  g2 r2 g' g4. g,8 b4. c8 d1 b r1 b1*2 b1*3 
  | % 93
  
}

cIIt = <<

  \clef bass
  
  \context Voice = voiceA \choirIITenorX
  \context Voice = voiceB \choirIITenor
>>


choirIIBaritoneX = {
  
  \set Staff.instrumentName = "2bar:voiceA"
  

  \key a \minor
  \skip 1*277 
}

choirIIBaritone = \relative c {
  r2*31 a'1 a2 a a d, 
  | % 7
  f f a1 g2 g2. d4 f2. e4 d1*2 r2 d'2. d4 d2 d4 a2 d a4 a2 r2 c1 
  f,2 a r4 a2 f4 a2. d4 a d, a'2 
  | % 12
  f4 d r4 d'2 d4 c a r4 c4. d8 e4 
  | % 13
  b d r4 d,2 d d'4 d2 r4 d 
  | % 14
  g, d' b2 r4*7 a2 d d,4 r4 d2 g4 d g2 c,4 g' 
  | % 16
  g f1*2 r2*59 g2 g4 d'2 g,4 r4 g2 c,4 e4. f8 
  | % 28
  g2 r2 c1 c2 c 
  | % 29
  r2 d1 b2 b4. c8 d2 
  | % 30
  r4 d,2 e8 f g2 d1 r1*39 g1 e2 c c1*2 r2*11 c2 c4 c c2 r2 e4 
  e2 e4 
  | % 48
  g4. g8 g2 c4 c2 a c4. c8 c4 
  | % 49
  r2 c,4 c2 c4 r2 g'8 g g4 r2 
  | % 50
  g g4 g d d r4 g c, g' r4 d 
  | % 51
  f2 r2*19 a4 a4. g8 f4. e8 d4 r4 d2 d4 a' c4. b8 a4 r4 e a d 
  c a4. b8 c4 f, a d,2 r1. e4 a2 d,4 a'2 
  | % 57
  g g4 d'2 a4 d2 d1 
  | % 58
  r2*15 a2. a4 a2 d, a' r1. g2 c, g' r2 g c, 
  | % 63
  g'4 g2 e4 g2 r4*41 d4 e2 b r2 b' g4 e a 
  | % 68
  d, g2 r2. g4 a a g e f2 c r4*5 d4 e2 f 
  | % 70
  r2. f4 c c g'2 g r4 g2 e4 g2 r2. g4. d8 d4 r4 g c, 
  | % 72
  g' r2 a e cis cis1 r2*27 a'2 a a d2. c4 b a 
  | % 79
  b2 c c,4 d e c g'2 r2 
  | % 80
  d1. d1*2 r1 d1. d2 
  | % 82
  d1 r2 d d4 f2 a d,4 a'2 r2 f c'1 f,2 r2. c'2 c4 c f,4. g8 a4 
  r4 d,2 f d4 d2 r2. d4 a' f f2 r2 g g r2. d'4. d,8 d4 
  | % 87
  d2 r2. d'2 b g4 g2 
  | % 88
  g1 r1 g2 g 
  | % 89
  r4 c,2 c'4. g8 g4 r4 g2 b b4 
  | % 90
  b4. c8 d2 r2 g,4 d'2 g,4 b4. c8 
  | % 91
  d1*5 
}

cIIbar = <<

  \clef bass
  
  \context Voice = voiceA \choirIIBaritoneX
  \context Voice = voiceB \choirIIBaritone
>>


choirIIBassX = {
  
  \set Staff.instrumentName = "2b:voiceA"
  

  \key a \minor
  \skip 1*277 
}

choirIIBass = \relative c {
  r1*17 d1. d2 d d 
  | % 7
  a c1 g2 d' d 
  | % 8
  g,1*3 
  | % 9
  r2 d' f f4. g8 a2 d, 
  | % 10
  r2 e e a1 e2 
  | % 11
  f1. d2 r4 d2 a'4 
  | % 12
  d,2 r4 a'2 e4 e2. g4 g2 
  | % 13
  r1. g,2 g g2. g4 d'2 r1. d1 g,2 d'1 r2*67 g2 g g g4. a8 b2 
  g 
  | % 28
  r1 c,2 g' e r2 
  | % 29
  g g, g' g2. f8 e d1 r4 g,2 d'4 d2 r2*93 d2. g2 g4 e2 r4 g2 
  e c g' c,4 e2. e4 g2 r2 c,4 c2 e4 a e e2 r4 g g4. a8 
  | % 49
  b2 r2 b, d4 d g2. g4 
  | % 50
  e2 d r1*12 g2 c,2. c4 e2 f4 a4. a8 e4 
  | % 56
  a2 a1 r1. 
  | % 57
  e2 f2. e4 d2 r4 d4. e8 f4. g8 a4 r4 d, g2 g r4*103 g,4 c2 g 
  r4 c g g c2 d r4*19 d4 a2 d r2. d4 a a b 
  | % 71
  g c2 g c d4 e c d e4. c8 g'2 e1 r2 a1 e2 a1*2 r2*27 d,2 d d 
  g2. f4 e2. d4 c2 b c g d'2. 
  | % 80
  c4 b4. a8 g2 d'1 r1 g,1. g2 g1*2 r2 d'1 f2 f a 
  | % 83
  f a2. a,4 a2 r2 a 
  | % 84
  c1 ais2 d r4 d2 g f8 e d2 r2. f d2 r4 
  | % 87
  g2 e4 f4. d8 a'2 r4 d, d2 r2 g, d' d c c g' 
  | % 89
  g4. f8 e2 c e1 c r2 d g b1 g2 
  | % 91
  b b4. a8 g1*2 
  | % 92
  g1*3 
  | % 93
  
}

cIIb = <<

  \clef bass
  
  \context Voice = voiceA \choirIIBassX
  \context Voice = voiceB \choirIIBass
>>


choirIIISopranoX = {
  
  \set Staff.instrumentName = "cIIIs:voiceA"
  

  \key a \minor
  \skip 1*277 
}

choirIIISoprano = \relative c {
  r2*43 d''1 d2 d d g, 
  | % 9
  b b d2. d4 a2 r2 
  | % 10
  d d d2. c4 c2 r2 
  | % 11
  f, c'4. b8 a4. g8 f2 f'1 
  | % 12
  f2 f f4. e8 d2 d2. c4 
  | % 13
  c2. b8 a b4 g a1 b2. g4 b4. c8 d2 d4. e8 f2 g e f d d1. b2 
  | % 16
  e, g r4 c, f2. f4 f2 
  | % 17
  r2*41 c'2 c c a4 d2 a4 r4 c4. d8 e4 f4. e8 d4 c b1 r2*9 g2 
  g2. c4 c2 r2 c 
  | % 28
  e e2. e4 e1 r2 
  | % 29
  b b2. d2 b4 b2. g4 
  | % 30
  d'2 b1 r2*67 g'1 d2 f e d1 r2 d d1*2 
  | % 44
  r1*7 d1 g,2. g4 g2 g' 
  | % 47
  e c g'2. g4 c,1 
  | % 48
  r2 a2. a4 a a e e'4. g8 g4 
  | % 49
  r2 g8 g g4 r2 d g,4 g g2 
  | % 50
  g4 c2 c4 r2*33 d2 b1 c r1 b4 g2 f8 e d2 r2 g4 b4. c8 d4 
  | % 58
  r1. d2. d4 d2 
  | % 59
  g, d' r1. e2. e4 e2 a, e' r2*19 e2 a, e' r2 e4 a,2 a4 
  | % 65
  c e r4 a,2 e'4 r4 a,8 b c d e4 r4 a, 
  | % 66
  a2 r4*37 f'4 e2 d r2. f4 e e d2 c r4 b e2 d c b4 e2 d c b4 
  c1 r2 cis a e' e1*2 
  | % 73
  r2*13 e2 e e g2. f4 e2. d4 c2 c d e f2. 
  | % 78
  e8 d c4 a2 d c4 a2 b1 r1*7 d1. g2 g1*2 r2*11 c,2 c c4 f2 d4 
  f2. ais,4 
  | % 85
  ais2 r2 d2. d,2 a'4 a2 
  | % 86
  r4 ais2 a8 ais a g g4 r2. a4 d2 
  | % 87
  r2 g, b b d r4 g, 
  | % 88
  g2 r2 g g1 r1. g'2 g4 g2 g f8 e d1 
  | % 91
  g,2 d'1 d1*5 
}

cIIIs = <<
  \context Voice = voiceA \choirIIISopranoX
  \context Voice = voiceB \choirIIISoprano
>>


choirIIIAltoX = {
  
  \set Staff.instrumentName = "cIIIa:voiceA"
  

  \key a \minor
  \skip 1*277 
}

choirIIIAlto = \relative c {
  r2*47 g''1 g2 g g d 
  | % 9
  f f a2. g4 f2. e4 
  | % 10
  e4. d8 c4. b8 a2 e' a,1 
  | % 11
  d2 r2 d a4 a' a4. g8 f4 d2 a' c g4 g2 g f4. e8 d2. b4 d4. c8 
  b4. a8 g2 r2 a e'2. e4 a,2 d2. g,2 b4 g g'2 
  | % 16
  d4 r4 g e c2 a4 a2. c2 
  | % 17
  a4 d2 r1*20 e2 e c f a2. g4 
  | % 25
  g1 fis2 g1 r2*7 g2 g4 d d2 r4 e4. f8 g4 g2 
  | % 28
  r2. c,2 c'4 c2 r4 c,2 e4. d8 c4 r4 g' g2 d g, r2 d'1 d2 g1 
  r2*65 c1 g2 b b a 
  | % 42
  r4 a2 d4. c8 b4 a d4. c8 a4 b1*2 r1*7 g2. g4. c,8 e c c4 g 
  g2 r2 
  | % 47
  e'4 e2 e4 r2 c2. c4 c2 
  | % 48
  r1. c'4 c2 g4 c4. c8 
  | % 49
  b1 r2. g4 g d d d 
  | % 50
  r4 e g2 r2*33 a2 d, g2. c,4 c2 r1 g4 b4. c8 d4 d2 r2 g,4 d'2 
  b4 
  | % 58
  b1 r2 d2. d4 g2 
  | % 59
  g g r1. e2. e4 a,2 r4 a2 e'4 e2 r1*9 e4 a4. d,8 a'2 e4 r2. a,2 
  d4 
  | % 65
  r4 c f4. g8 a2 r4 f c'2 f, 
  | % 66
  r2*19 f4 a4. g8 e4 a2 r2. a4 a a 
  | % 70
  a2 a r2. e4 g2 g 
  | % 71
  r2. g4 e c' b g g2 r1 e e2 e1*2 r2*15 a2. g4 a b c2 b a1 r2 e 
  a a a a2. e4 fis2 g1 r1*7 b1. b2 b r4 b,2 d4 d2 r1*5 f2 f f4 
  a2. d,1 
  | % 85
  r2 g g1 r2 d' 
  | % 86
  d1 r1 d2 d 
  | % 87
  r4 g,2. g4 g g2 g r2. g2 e4 g c, r4 g'4. e8 e4. f8 g4 r2. c,4 
  e g2 g4 r4 d2 g4 g2 g r2. d4. b8 b2 g4 r4 d' b d 
  | % 92
  d1*4 
}

cIIIa = <<
  \context Voice = voiceA \choirIIIAltoX
  \context Voice = voiceB \choirIIIAlto
>>


choirIIITenorX = {
  
  \set Staff.instrumentName = "cIIIt:voiceA"
  

  \key a \minor
  \skip 1*277 
}

choirIIITenor = \relative c {
  r2*45 d'1 d2 d d g, 
  | % 9
  b b d2. d4 a2 r2 
  | % 10
  a c e1 d 
  | % 11
  cis2 d2. c8 b a2 f r2 
  | % 12
  a d2. d,4 a'2 e4 g c2 
  | % 13
  b a1 g r4 g2 b4. c8 d4 r4 d e2 g f4 d4. c8 
  | % 15
  a4 d2. d4 b1 r4 g g 
  | % 16
  c2 f,4 a c2 a4 a2 r2*41 e'2 e e a,1 e' a,2 d2. g,4 d'2 r2*7 d2 
  d4 d d2 r2 c c4 g2 d'4 r4 e2 c g4 g2 r2 g' g4. g,8 b4. c8 d2. 
  d4 b1*3 r2*49 g'1 c,2 e1 d4. c8 
  | % 40
  b4 g a4. b8 c4 g2 d'4 b d r4 d2 cis4 d2. d4 d2 c1. b2 d2. a4 
  c2 f4. e8 d2. c8 b a2 d1*2 r1*8 g,2. c2 g c4 c g g2. g4 c2 r4 e, 
  e e r4 c'2 c4 c2 r1 g2. g4 g2 r2 
  | % 50
  g4 d' d d4. g,8 g4 r4 c e2 r2*33 f2 g2. f4 e1 r1 d4 g,4. a8 
  ais4 f a r4 d4. b8 d4 g,2 
  | % 58
  r1. d'2. d4 b2 
  | % 59
  r4 g2 d'4 d2 r1 e2. e4 e2 d c r2*19 c2 a4. b8 c4 a r2 a a4 
  f 
  | % 65
  c'4. b8 a2 a r4 a2 c4 a2 
  | % 66
  r2*19 a4 d2 c4 d2 r2. d4 e e 
  | % 70
  f d e2 r2 c4 g4. a8 b4 c2 
  | % 71
  r4 g4. a8 b4 c g'4. f8 d4 e1 
  | % 72
  r2 e a,2. cis4 cis1 
  | % 73
  r2*19 g2. a4 b2 c2. b4 a f 
  | % 77
  g2 a f4 a4. b8 c4 f,2. g4 
  | % 78
  a2 r2 d g,1 r1*6 d'2. g2 d g, g' d b4 d2 r2 d d c c2. a4 a2 
  r2. c2 f, c'4. ais8 
  | % 84
  a4 r4 f'4. c8 c4 r2 ais f r2 g d' r4 d2. a4 f'4. e8 d4 
  | % 87
  r4*5 d4 d2 r2 b 
  | % 88
  b r2. g' g4 g g2 
  | % 89
  c, r2. c2 e4 g c, c1 g2 r4 b d2 r2 d,2. g4 
  | % 91
  d2 r4 d' d2. g,2 b g4 
  | % 92
  r4 g g1*3 
}

cIIIt = <<

  \clef bass
  
  \context Voice = voiceA \choirIIITenorX
  \context Voice = voiceB \choirIIITenor
>>


choirIIIBaritoneX = {
  
  \set Staff.instrumentName = "cIIIbar:voiceA"
  

  \key a \minor
  \skip 1*277 
}

choirIIIBaritone = \relative c {
  r1*24 g'1. g2 g f 
  | % 10
  d f f a1 g f2 e1 d r2 
  | % 12
  d2. f4 f4. g8 a4 d, f2 c2. e2 c4 d4. e8 f2 f4. e8 d1*2 r2 d4 
  d g2 c, f f4. e8 
  | % 15
  d1*2 c r2*43 e2 e e d1 e2 
  | % 25
  c f2. e4 d1 r2*7 g2 g4. f8 d2 r1. 
  | % 28
  d4 g2 e e4 e4. f8 g2 r4 c 
  | % 29
  c2 r4 b2 g4 g2 r4 g2 d'4. g,8 b4. c8 d4 d, g2. b4 g a4. b8 
  c2 r4*91 c2 g b4. a8 g2 f4 g e g2 r2 d'1 g,2 b b 
  | % 41
  a g4 e f d2 f4 a f c' c,2 e4 g c, r4 g'4. a8 b g a2. e4 a2 
  r4 d, f2 f4. e8 d1*2 r1*8 c2 g'2. c4 c2 r2 c 
  | % 48
  c2. g4 c g g2 r2 f 
  | % 49
  c'4 c,4. d8 e4. f8 g4. c,8 c'4 r4 d4. d8 d4 
  | % 50
  r2 g,4 g2 g4 g g r2 g 
  | % 51
  d8 e f g a4 f c'2 r1*15 d2 d g, g r1*2 d2. d4. e8 f d g1 r1. d4. 
  d8 g4 b4. a8 g f e2 b' r1. e,4. e8 a4 c4. b8 a g f4 d e2 r2*19 c2 
  f c r2 c' a 
  | % 65
  a4. g8 f2 c r4 d e2 f 
  | % 66
  r4*39 d4 a'2 d, r2. d4 a' a d,2 a' r1. g2 g 
  | % 71
  g g1 g2 r1 
  | % 72
  a a2 a1*2 r1*23 g1. g2 g1*2 r4*5 a2. a4 f c'2 
  | % 84
  a4 c2 f,4 a2 r4 a f a a2 
  | % 85
  r2. a4. g8 f d d'2. ais4 ais2 
  | % 86
  r2 g d a' a r2. c2 c4 f,2 r4 d'2. g,4 b r2 b1 b4 g2 c c,4. 
  d8 e4 
  | % 89
  r2 e4 g2 c, c' g4 g1 r2 d d1 r1 
  | % 91
  d d1*5 
}

cIIIbar = <<

  \clef bass
  
  \context Voice = voiceA \choirIIIBaritoneX
  \context Voice = voiceB \choirIIIBaritone
>>


choirIIIBassX = {
  
  \set Staff.instrumentName = "cIIIb:voiceA"
  

  \key a \minor
  \skip 1*277 
}

choirIIIBass = \relative c {
  r2*53 d1 d2 d d a 
  | % 10
  c1 d2 a a d1 f1. d2 f1 
  | % 13
  e c2 g' r2 d1 d2 g d d1 r1. d2 d g1 g4. f8 e1 r2 c4 c c1 r2*41 e2 
  a, a' a f g1 a2. a4 g1 r2*7 g,2 g d'4. f8 e4. d8 c2 c 
  | % 28
  b c g'1 c, 
  | % 29
  c2 d b r4 d2 g,4 g1*3 r2*47 c1 g2 b a c1 g r2 g'1 d2 
  | % 41
  f e d f1 c2 
  | % 42
  e e d d1 e2 
  | % 43
  f4 f g2 a1 g1*2 r1*7 g1 g2 g e1 
  | % 47
  r2 c c c c2. c4 
  | % 48
  c2 r4 a2 e'4 e a2 g4 e4. f8 
  | % 49
  g4 g, g2 r2 d' d2. d4 
  | % 50
  c2 c f f r2*31 d2 g1 c,2 r1*2 g'2 a1 b r1. g2. g4 g2 g g r1. a2. 
  a4 e2 a a r2*19 a,2 d a r2 a d 
  | % 65
  a d a r4 d a'2 d, 
  | % 66
  r1*19 a2 cis e1 cis4 a e'2 
  | % 73
  a, r1*23 d1. d2 d1*2 r2 f f f a f 
  | % 84
  r4 c2 a4 c2 r2 c c 
  | % 85
  c f1 ais,2 d1 
  | % 86
  g, r4 d'2 d4 f2 ais 
  | % 87
  g1 a g 
  | % 88
  r2 g g g g1 
  | % 89
  e4 c g'1 c,2 c1*2 g1*9 
}

cIIIb = <<

  \clef bass
  
  \context Voice = voiceA \choirIIIBassX
  \context Voice = voiceB \choirIIIBass
>>


choirIVSopranoX = {
  
  \set Staff.instrumentName = "cIVs:voiceA"
  

  \key a \minor
  \skip 1*277 
}

choirIVSoprano = \relative c {
  r2*75 d''1 d2 d d g, 
  | % 14
  b1 a2. g4 g1 
  | % 15
  fis2 g1 r2 g2. c4. d8 e4 f2. f,2 c'2. f,4 ais4. 
  | % 17
  a8 g4 r4 e a c ais4. a8 g4 d e2. f4 g1 r2*31 e'2 e e f1 e2. 
  c4 d2 d d1 r2*7 b2 b4. c8 d2 r4 g, g2 r2 
  | % 28
  g g4 g4. g8 g4 r1. 
  | % 29
  g'2 g g2. f8 e d2 d 
  | % 30
  g, d'1*2 r2*53 g1 d2 f e d 
  | % 40
  d a c b4 a8 g f4 d r4 a'2 f4 g2 e4. f8 g a b4 g d' d2 r2 a 
  b4. c8 d e f4. e8 d4. c8 b4 g d'2 b4 b2 r1*7 b1 e,2. e4 e2 r4 e' 
  | % 47
  e2 e4 e2 e4 e2 r2 c4 c2 c4 c2. c4 c2 r1 d4. d8 d2 r2 d g2. 
  g4 g2 g f4 d d2 r2*31 f2 d1 e r4*7 d4 d2 a4 d d1 r1. b2. b4 b2 
  g4 e g2 r1. c2. c4 c2 a4 f c'2 r2*19 c2 d c r2 c d4 a2 c4 f,2 
  r4 c' f d2 cis4 d2 r4*39 d4 c8 b a g f4 a a2 r4 f a a f4. g8 
  a2 r2. g4 g2 g r2. d'4 g, c d g2 e4 e2 r2 cis1 cis2 cis4. d8 
  e2 r2*19 e,2 e g a e r4*5 a4 d2 e f2. e4 d2. 
  | % 79
  g,4 d'2 c1 r1*6 d1. d2 d1*2 r2*15 d2 d d g2. d2 c8 ais 
  | % 86
  a4 d,4. e8 f4 r2. e2 g4 d f4. g8 a4 r4 b b2 r1. g2 g4 g g c 
  c2 r2 c e2. e4 e1 e2 r2 b b2. d2 b4 b2. g4 d'2 r2 d g1 g1*3 
}

cIVs = <<
  \context Voice = voiceA \choirIVSopranoX
  \context Voice = voiceB \choirIVSoprano
>>


choirIVAltoX = {
  
  \set Staff.instrumentName = "cIVa:voiceA"
  

  \key a \minor
  \skip 1*277 
}

choirIVAlto = \relative c {
  r2*61 a''1 a2 a a d, 
  | % 12
  f f a a4. g8 f4 d e2 
  | % 13
  c r2 g' g fis g1 r1. d'2 b c 
  | % 15
  a1 b2 b b b 
  | % 16
  c c4. ais8 a4 f c'2 f, a 
  | % 17
  d,1 r2 a d g,4 g'2 g4 c,2. d4 e2 a,1 r2*29 a'2 a a2. f2 d4 
  g2 
  | % 25
  e a r4 d,2 b4 g g'2 e4 
  | % 26
  e2 r2*5 
  | % 27
  g2 g g c,4 e r4 e e2 
  | % 28
  r4 g c, g' g2 r2 g c, 
  | % 29
  r2. g'4. b8 b4. g8 g4 r4 d d2 
  | % 30
  r4 b g2 r4 g'2 d d4. c8 a4 
  | % 31
  e'2 r2*49 c'1 g2 b b a 
  | % 40
  r4 g2 b4. a8 g2 fis4 g2 r2. d2 a c4 c g2 g' g4 g4. f8 d4 f 
  a c4. b8 a4. g8 g2 fis8 e fis2 g1*2 r2*15 g2 g2. c,4 c2 r2. g'4 
  | % 47
  c2 c4 c4. c8 c4 r2. c,4 c2 
  | % 48
  c r4 c4. a8 a4 r1 d4. g8 
  | % 49
  g2 r2 g4 g g b4. g8 g2 g4 
  | % 50
  r1*17 a2 g4. f8 d2 g r1*2 g4 d4. a'8 a4. d,8 d4 r4 g2 d4 d2 
  | % 58
  r1 g2. g4 g2 c 
  | % 59
  b r1. a2. a4 
  | % 60
  a2 a a r2*19 a2 a a r2 a a 
  | % 65
  a a a r4 a a2 a 
  | % 66
  r4*39 d,4 e2 f4 d r2. a'2 c4 d 
  | % 70
  a2 c4 r2 c,4 g'4. d8 g4 e g r4 
  | % 71
  g g2 g r1*2 a1 a2 a1*2 r2*19 e2 e e a2. g4 f4. e8 
  | % 78
  d4 a a2 a' d, a' d,1 r1*7 d1. d2 d1*2 r2*13 f2 f f ais1. 
  | % 86
  g2 a1 r2 g2. e4. d8 c4 r4 a d2 r4 d4. g8 g4 r2. b2 b4 b b c2 
  c r2 b4 
  | % 89
  g2. e2 r4 g g g g c2 
  | % 90
  g4 r4 g,2. g2 r4 g' b1 r2 b b1*5 
}

cIVa = <<
  \context Voice = voiceA \choirIVAltoX
  \context Voice = voiceB \choirIVAlto
>>


choirIVTenorX = {
  
  \set Staff.instrumentName = "cIVt:voiceA"
  

  \key a \minor
  \skip 1*277 
}

choirIVTenor = \relative c {
  r2*65 d'1 d2 d d a 
  | % 12
  a c e1 d2 d2. c4 b1 b2. g4 b4. c8 d1 cis2 d1 r2 d g,4 b4. c8 
  d4 r2 e a,4 c c2 r4 f, c'2 ais4 d2 g,4 r4 c2 f,4 ais g d'2 
  | % 18
  r4 g, g2 r2*33 c2 c c d d g, 
  | % 25
  g' f4 d4. c8 a4 d1 r2*7 d2 d4 d d2 r2 e e 
  | % 28
  r2 e g1 r2 g, 
  | % 29
  c b4 g d'2 r2 d1 
  | % 30
  d2 d1*2 r1*22 f1 c2 e2. d4 b2 
  | % 39
  d f e4 c2. b2 g 
  | % 40
  f4 d e4. f8 g1 r2 g'1 d2 f f e2. c4 d2 
  | % 42
  b d r4 a d4. c8 b4 g' f d 
  | % 43
  r4 d b g d'2 d1 r1*8 c2 c c4. d8 e2 r4 e, g2 
  | % 48
  g4 g4. g8 g4 r2. e'4. d8 c4. b8 a4 
  | % 49
  r4 e'4. c8 c2 g'4. e8 e4 b d4. d8 g,4 
  | % 50
  r2. d4 d4. d8 d4. g8 g4 g r1*17 a4 d2 g,4 d'2 c1 r1. d4 d4. 
  c8 d e f4 d d1 r1. b2. b4 d2 e d r1. c2. d4 e2 f e r2*19 e2 f 
  e r2 e f 
  | % 65
  e d c r4 f e2 d 
  | % 66
  r4*39 a4. b8 c4 f,2 r2. f4 c' c f,2 c' r2*11 e1 e2 e1*2 r2*15 e2 
  e e g2. f4 e a,8 b 
  | % 77
  c d e4. d8 d4. b8 c4 d2 f e 
  | % 78
  d d1 r1*8 b1. b2 b r4 b2. b4 g d'2. c8 b a2 r2 f4 c'2 f,4 r4 f 
  c'2. d8 e f2 r4 f2 
  | % 84
  c4 r4 c c2 r1 d2 d d g f r4 d2. d2 
  | % 87
  r1 d, d2 r4 d' 
  | % 88
  d d d g, g2 r1 e2 
  | % 89
  e r2 g g r2 e 
  | % 90
  e' e b4 d g, b b1 
  | % 91
  r2. d,4 g b g d'2 b4 d2 
  | % 92
  d1*4 
}

cIVt = <<
  \context Voice = voiceA \choirIVTenorX
  \context Voice = voiceB \choirIVTenor
>>


choirIVBaritoneX = {
  
  \set Staff.instrumentName = "cIVbar:voiceA"
  

  \key a \minor
  \skip 1*277 
}

choirIVBaritone = \relative c {
  r1*31 a'1. a2 a a 
  | % 12
  d, f f a1 g2 
  | % 13
  g1 r2 d'1 d2 
  | % 14
  d d g, a b g 
  | % 15
  a a g1 r2 g1 c,2 f2. a2 f4 f2 r2*41 a2 a a f1 c'2 
  | % 25
  c f,4. g8 a2 b1 r2*7 b2. g4 g2 g1 r1 g2 g r4 c,2 c'4. g8 g4 
  r4 g2 b2. b4. c8 d2 r4 g,2 d' 
  | % 30
  g,4 b4. c8 d2 g, r2*43 ais1 f2 a g g1 r2. c,4. d8 e4 c g'2 
  d4 d2 
  | % 40
  r1. d'1 g,2 
  | % 41
  b b a1 g2 g2. d4 g2 f4 d a'2. d,4 d2 r4 
  | % 43
  a' d1 b2 b1 r1*8 c2 g2. g4 g2 r4 c,4. e8 e4. c8 c'4 r4 c,2 
  g'4 g c4. c8 c4 r2. c, g'4 c, r2. b4. b8 b4 r2. b'4 g g d'4. 
  g,8 g4 g r1*17 a2 b2. a4 g2 r1*2 d'2 a d, r4 d d2 r1. d2. d4 
  d2 c d r1. e2. e4 c2 f c r2*19 e2 d e r2 c f4 d 
  | % 65
  a'2 d, e r4 f c a' a2 
  | % 66
  r4*39 a4 a2 a r2. a4 a a a2 a r2*11 e1 e2 e1*2 r2*17 e2 e e 
  a2. g4 f2 
  | % 77
  e d1 a'2 d, a'1 r1*8 d,1. d'2 b g2. d4 g2 r2 a a a4 c2 
  | % 83
  f, c4 c1 r4 f2 c' 
  | % 84
  f,4 f2 r4 f4. e8 c4 r4 f2 d4 d1 r2 d f1. r2 
  | % 87
  e c r4 a'4. g8 f4 r4 d'4. c8 b4 
  | % 88
  r4 g g g4. a8 b2 b4 r4 g c, g'2 c4 r2 c2. g4 g1 r2 g g1 r2 g 
  g4. a8 
  | % 91
  b4. c8 d2. b4 b1*5 
}

cIVbar = <<

  \clef bass
  
  \context Voice = voiceA \choirIVBaritoneX
  \context Voice = voiceB \choirIVBaritone
>>


choirIVBassX = {
  
  \set Staff.instrumentName = "cIVb:voiceA"
  

  \key a \minor
  \skip 1*277 
}

choirIVBass = \relative c {
  r1*33 d1. d2 d d 
  | % 13
  a c1 g2 d' d 
  | % 14
  g,1 r2 g'1 f2 
  | % 15
  e1 d g, 
  | % 16
  g2 g c2. c4 f,1*2 r2*41 a2 a a d1 c2 
  | % 25
  e d2. d4 g,1 r2*7 g'2 g r4 g2 e4 g2 g1 r2 c, c e1 c2 
  | % 29
  g'4*7 f8 e d1 
  | % 30
  d1*2 r2*45 f1 c2 e d1 
  | % 39
  a'2. g4 e2 g r4 g, d'2 
  | % 40
  c b4 g2. d'2 r1 
  | % 41
  d a2 c c g1 d'2 c d4 d g,2 d'1 
  | % 43
  g,1*2 r1*7 d'1 c2. c4 c2 r4 g' 
  | % 47
  g2 c, e2. e4 e2 r2. a,2 a'4. a8 a4 e c2 c4 e c r4 
  | % 49
  g' g2 r2 g, g4 g b b e2 c r2*41 g2 d'1 g,1*2 r2 g2. g4 b2 c 
  b 
  | % 60
  r1. a2. a4 c2 
  | % 61
  d a r2*19 a'2 a a r2 a d, 
  | % 65
  r4 e f a4. g8 e4 r4 d a2 d 
  | % 66
  r1*19 a1 a4. b8 cis4 a cis2 a1 r1*23 g1. b2 d g, 
  | % 82
  g1 r1. c2 
  | % 83
  c c f2. f4 c2 c 
  | % 84
  r2 c a c r2 f 
  | % 85
  f g4 a ais2 ais a1 
  | % 86
  d, r1. d2. g,4 d'2 r2 d d g,4 g'2 
  | % 88
  c,4 e2 e4 g2 d4 r4 g2 e4. f8 
  | % 89
  g2 c, g'4 g2 r4 g2 d 
  | % 90
  g,4 d'1 g2 g1*6 
}

cIVb = <<

  \clef bass
  
  \context Voice = voiceA \choirIVBassX
  \context Voice = voiceB \choirIVBass
>>


choirVSopranoX = {
  
  \set Staff.instrumentName = "cVs:voiceA"
  

  \key a \minor
  \skip 1*277 
}

choirVSoprano = \relative c {
  r2*89 d''2 d d e1 c c2 f2. e4 d2. c4 c1 b2 c2. d4 e1 f2 
  | % 19
  c d2. c8 ais a4 d, a'2 r2 
  | % 20
  d1 g,2. a8 b c2 r2 
  | % 21
  e e e g1 f2 
  | % 22
  d e2. e4 e1*2 r2*23 d2. g,4 b2 g g' g 
  | % 28
  g g1 r2 g, c4. d8 
  | % 29
  e2 r2 d4 b2 g b4. a8 g4 
  | % 30
  r4 d'2 b4 b2 r4 b2 d4 d2 
  | % 31
  r1*19 f1 c2 e d2. d4 
  | % 38
  c2 r4 c2 g c4 d2. g,4 
  | % 39
  c a r4 e'2 c4 d g, g d' d2 
  | % 40
  r2*37 b1 e1. e2 
  | % 47
  e1 r1 g2 e 
  | % 48
  c f2. e4 e2 r4 c g'2 
  | % 49
  g1 r2 g4 d2 d4 b2 
  | % 50
  e,4 g2 e4 r4 a d,2 r1*3 d'1 e2 e f f 
  | % 53
  g1 f2 e e1 
  | % 54
  e r4*37 g,4 g2 r2 d d r4 d'2 
  | % 58
  d4 b2 g4. a8 b2 r2*29 e2 f e r2 e f 
  | % 65
  e d c r4 f e2 d 
  | % 66
  r4*11 d4 
  | % 67
  c2 b r4 e d d c2 b 
  | % 68
  r1*14 e1 e2 e1*2 r2*5 e2 
  | % 75
  e e g2. f4 e2. d4 
  | % 76
  c2 b a e' e1 
  | % 77
  r1*14 d1. d2. e8 f g2 
  | % 82
  g1 r2*9 c,2 c c f1. 
  | % 85
  d2 r4 d g, d'4. c8 ais4 r4 g d' a2 d4 r4 d2 d4 e2 g2. fis4 
  fis2 g1 r2 d d d 
  | % 88
  e1. d2. c4 c1. g2 r4 g2 f8 e d1. 
  | % 90
  r2 d'2*13 
}

cVs = <<
  \context Voice = voiceA \choirVSopranoX
  \context Voice = voiceB \choirVSoprano
>>


choirVAltoX = {
  
  \set Staff.instrumentName = "cVa:voiceA"
  

  \key a \minor
  \skip 1*277 
}

choirVAlto = \relative c {
  r2*91 g''2 g g a1*2 f2 g a2. a4 g1. e2. f4 g2 c, f2. g4 
  | % 19
  a2 d, f d4 g2 g d4 
  | % 20
  d2 r1 e2 a a 
  | % 21
  c1 b2. a4 a1 
  | % 22
  gis2 a1 r2*25 d,2 d4 d d2 r2. g2 g4 
  | % 28
  g2. c,4 c2 r4 g'4. e8 e4. c8 c2 e4 g2 r4*5 g,4 g2 g'4 
  | % 30
  d r4 g d2 d2. g4 f d g2 r2*33 c1 g2 b4 b a2 r4 a 
  | % 37
  a c4. c8 g2 ais f4 a2. f4 
  | % 38
  g2 g1 r2 a e4 g2 c,4 g'1 r2*37 d2 g2. g4 g1 r2 
  | % 47
  g4 g2 c, e e4 e2 r2 
  | % 48
  c' c a c r4 c,4. e8 e4. c8 c4 r4 b4. c8 d4 r2 d d4. g8 g4 g 
  g g r1*5 g1 c2 b4 a2 d,4 g2 
  | % 53
  e r2 e g4. f8 e4. d8 c1 r4*33 a'4 d2 d4. c8 b2 r4 a4. g8 f4 
  r2 d4. d8 g4 b4. a8 g f e4 c d2 r2*29 e2 a a r2 a a 
  | % 65
  a f4 a a2 r4 a a4. g8 f2 
  | % 66
  r4*7 a4 c2 g 
  | % 67
  e4 g2 d4 r4 g g g g2 g 
  | % 68
  r1*14 e1 e2 e e e 
  | % 73
  e a1. g2 a 
  | % 74
  e r2 a2. g4 a b c2 
  | % 75
  b a e e1 r1*15 d1 b2 g d'2. g2 f8 e d4 b r4 d d2 r2*5 a'2 a 
  a c a a1 r2 d,1. d1 
  | % 86
  r1 f2 ais, r4 g' g2 
  | % 87
  r2. d4. b4 g8 g2 r4 g'2 g g4 g2 g r2. g2 b4 e,1 r2 c' c2. b8 
  a b2 b 
  | % 90
  r2 b4*5 g4 g1*6 
}

cVa = <<
  \context Voice = voiceA \choirVAltoX
  \context Voice = voiceB \choirVAlto
>>


choirVTenorX = {
  
  \set Staff.instrumentName = "cVt:voiceA"
  

  \key a \minor
  \skip 1*277 
}

choirVTenor = \relative c {
  r2*93 c'2 c c f1. 
  | % 17
  ais,2 c a ais2. a4 g2 
  | % 18
  c4. b8 g1 f2. g4 a1 f2. a4 g2 d r2 d' 
  | % 20
  g,4 c e8*7 d8 c4 e a,1 
  | % 21
  r2 g d' d g1 
  | % 22
  c,2 e e2. b4 c4. d8 e4 c 
  | % 23
  d2 g, r2*21 g'2 g g c, r2. c2 e4 g c, c2. c4 g2 r4 b d2 r2 d,2. 
  g4 d2 r2. d'4 
  | % 30
  d g2 d4 d2 r2*27 f1 c2 e2. d4 b2 
  | % 36
  d f4. f8 e4 c2. d2 d 
  | % 37
  d4 f2 c4. d8 e c d1 a2 
  | % 38
  r4 c2 e g d4 d2 r4 c2 c4 e2 b4 d4. c8 b4 r4 d g2 d r1*17 g,4 
  d'2 d4 b2 r2 c4 g'4. e8 e4 
  | % 47
  r2 c4 g'2 c,4 g c2 e c4. g8 g4 r1 e4 a2 a4 r2. g4. d'8 d2 d4 
  r2 b4 b4. c8 d2 
  | % 50
  d4 r2. c4. b8 d4. c8 a4 r1*3 b1 c2 c d d 
  | % 53
  e2. b4 d2 c b1 
  | % 54
  a r1*10 a4 f4. e8 d4 r4 b' b2 r4 g4. g8 g4 
  | % 58
  g2 g r2*29 g2 d' c r2 c d 
  | % 65
  c f, r2. a4. b8 c4 d2 
  | % 66
  r4*7 f4 e2 d4 d 
  | % 67
  g,2 d' r4 c d d e c d2 
  | % 68
  r1*14 cis1 cis2 cis r4 c c2 
  | % 73
  c e a, r2 e a 
  | % 74
  b c1 b r1*18 g4. a8 b4. c8 d2. e8 f g4 d d2 
  | % 82
  r4 d b d2 a4 a2 r2*5 c2 c c4 f2 c4 c2 r1 ais4 d4. c8 ais2 f'4 
  r4 g d2 r2 
  | % 86
  d2. a4 d2. ais4 c2 g 
  | % 87
  r4 d' a2 r4*5 d4 d d 
  | % 88
  d b b2 r4 c2 e4. c8 c4 r2 
  | % 89
  c4 g g2 r2 g'2. e4 e2 
  | % 90
  r4 b b4. a8 g2 r4 g2 b4 b2 
  | % 91
  r2 b b1*5 
}

cVt = <<
  \context Voice = voiceA \choirVTenorX
  \context Voice = voiceB \choirVTenor
>>


choirVBaritoneX = {
  
  \set Staff.instrumentName = "cVbar:voiceA"
  

  \key a \minor
  \skip 1*277 
}

choirVBaritone = \relative c {
  r2*95 f2 f f ais1 a2 
  | % 17
  f g g c,1 r2 
  | % 18
  c' c4. ais8 a4. g8 f2. g4 a2 
  | % 19
  d, d1*2 r2 
  | % 20
  g c, c c1 r4 g'2 e4 f4. g8 a2 r2 e1 a2 g e r2*23 g2 b4 b4. 
  c8 d4 r2 g, g 
  | % 28
  g2. g4 g2 r2 g1 
  | % 29
  c,2 r2. g'2 d d' g,4 
  | % 30
  d' g, g1 r4*41 f2 c c' c4 b g a4. a8 d,2 r1 ais' f2 a 
  | % 36
  g g1 r1. 
  | % 37
  g2. g4 a2. f4. g8 a f g2 
  | % 38
  r1 c4 f,4. g8 a4 e1 
  | % 39
  g2 d r1. d2 
  | % 40
  g d r2*39 c2 e2. e4 g2 r2. e4 
  | % 48
  e2 e g4. g8 g2 r2 c4 c2 a c4. c8 c4 g4. a8 b4 g g2 r2 g g4. 
  b8 b4 b r4 c g2 r2*7 d'1 g,2 g4 c4. b8 a g f4 d4. e8 f4 c2 r2 d4 
  a'4. e8 a4 g e r4 e e2. a4 f d a'2 r2*17 d2 d d r2 g,2. g4 
  | % 58
  g2 c, g' r2*29 e2 d e r2 a d, 
  | % 65
  e4 a2 d,4 e2 r4 d a'2 d, 
  | % 66
  r4*7 d4 e c g' g 
  | % 67
  g2 g r4 c, g' g c,2 g' 
  | % 68
  r1*14 a1 a2 a1 r2 
  | % 73
  a a a c2. b4 a2 
  | % 74
  g a1 e r2 
  | % 75
  g a b c1 b r1*14 g1. g2 d r4 d2 g4 g2 r2*5 a2 a a4 c2 a4 r4 a 
  a2 
  | % 84
  f4 a2. f4 c' r2. f,4 f ais 
  | % 85
  ais d2 d4 r4 d,2 a'4 f d d2 
  | % 86
  r4 g2 c,4 c2 r4 d2 d' d,4 
  | % 87
  g d r4 g g g g d'2 g,4 r4 g2 c,4 e4. f8 g2 r2 c c4 c c2 c r2 d1 
  b2 b4. c8 
  | % 91
  d2 r4 d,2 e8 f g2 d1*5 
}

cVbar = <<

  \clef bass
  
  \context Voice = voiceA \choirVBaritoneX
  \context Voice = voiceB \choirVBaritone
>>


choirVBassX = {
  
  \set Staff.instrumentName = "cVb:voiceA"
  

  \key a \minor
  \skip 1*277 
}

choirVBass = \relative c {
  r1*52 c1 c2 c f1 
  | % 19
  f2 d r2 d g, g'2. f8 e d2 c1 r1. e2 e e a f g2. f4 e2 c4 a 
  e'1 a, r2*21 g2 d'1 c g'2 
  | % 28
  g4. f8 e2 c e e c1 r2 d g b1 g2 
  | % 30
  b b4. a8 g1 r2*17 d1 a2 c c g 
  | % 34
  d' d f c r1 
  | % 35
  f c2 e d1 
  | % 36
  a'2. g4 e2 g f d4 a'4. g8 f4 e c g'2 r1*25 g2 g1 c,2 g' r4 c, 
  | % 47
  e2 e g4 g c,2 g'4 e2 c4 
  | % 48
  c2. c4 c4. d8 e2 r2 g2. d4 d2 r2 d b4. c8 d4 g, r4 
  | % 50
  g'2 c4 f, a2 d,4 g2 r2*5 g1 c,2 e d f 
  | % 53
  e1 d2 a e'1 
  | % 54
  a, r2*19 d2. a'2 d,4 r4 d4. b8 b4. c8 d4 
  | % 58
  r4*95 d4 a2 b4 g c2 g r1*16 e'1 a, e'2 e1 r1*23 d1. g,1 d'2 
  | % 82
  d1*2 r2*5 f2 f f a1 f r2 f d g g1 
  | % 86
  r2 a f g r4 e2. 
  | % 87
  a2 d,2. g4 g2 r2 g, 
  | % 88
  g g c1 c2 g 
  | % 89
  c c g'1 e 
  | % 90
  d1. b2 b4. c8 d2 
  | % 91
  r2 g, g1*5 
}

cVb = <<

  \clef bass
  
  \context Voice = voiceA \choirVBassX
  \context Voice = voiceB \choirVBass
>>


choirVISopranoX = {
  
  \set Staff.instrumentName = "cVIs:voiceA"
  

  \key a \minor
  \skip 1*277 
}

choirVISoprano = \relative c {
  r2*99 g''2 c c g'2. f4 e c 
  | % 18
  e2. d4 c1 r2 a 
  | % 19
  a a d2. c4 b g b1 c2 c2. a4 c2. b4 a2 
  | % 21
  g e r4*5 g4 b e,2 a e g4. f8 e4 r2 e4. f8 g4 
  | % 23
  d g2 r2*19 b2 b4 d2 b4 r2. c4. g8 g4. d8 d4 r2. g4 e e'2 e4 
  e c c2 r2. g4 d'2. g2 g4 g2. d d1 r2*23 f1 c2 e d2. d4 
  | % 35
  c2 r2. c2 g b d4. c8 c2 g4 r4 g g d'4. d8 d4 d2 c c r1*27 g1 
  c8*7 d8 e2 r4 e,2 g4 g c c g r2. c4 c4. a8 a4 
  | % 49
  e' e e,2 g b4 b2 r2 g' g4 g g2 g,4 g2 g4 r2. a2 e4 g2 r1*2 g2 
  d' c4. b8 g2 r4 f d a' e g 
  | % 53
  g2 r4 d a'2 b1 c2 
  | % 54
  a a1 r4*33 b4 d2. d,2 a'4 r2 b2. 
  | % 58
  b4 d2 e d r2*29 b4. c8 d4 a c2 r2 c f,4 a4. e8 e4 r2 e4 a2 
  f4 r4 a a2 r1. a4 d4. c8 c4 d2 r4 g, b d g, e 
  | % 67
  g g e2 g r1*14 a2. e'2 cis4 cis1 r2 
  | % 73
  c c c e2. d4 c2 
  | % 74
  b a e' e1 r2 
  | % 75
  e,2. f4 g2 e4 a4. b8 c a b1 r1*14 g2 d'2. b2 g d' b4 
  | % 82
  b2 r2. a2 a f4 c'2 
  | % 83
  a4 c2. f,4 a2 f4 r4 c' c2 
  | % 84
  c4 f2 f,4 c' a a2 r4 ais2. 
  | % 85
  f'2 r2. d4 ais2 r4 f'2. 
  | % 86
  f2 r2. c a2 r4 d2. d2 r2 b b g g 
  | % 88
  g r1. g'2 g4 g 
  | % 89
  g2 g r4 g,2 d'2. d1. b2 b1*6 
}

cVIs = <<
  \context Voice = voiceA \choirVISopranoX
  \context Voice = voiceB \choirVISoprano
>>


choirVIAltoX = {
  
  \set Staff.instrumentName = "cVIa:voiceA"
  

  \key a \minor
  \skip 1*277 
}

choirVIAlto = \relative c {
  r1*52 g''1 g2 g a1. f2 f f g r4 g2 b4. a8 g2 e4 g c, r4 a'2 e 
  c4. 
  | % 21
  d8 e2 e e4 a, a d2 r2 g c a4 c4. b8 b2 g4 a a e2 
  | % 23
  r2*21 g2 g4 g2 d4 r4 c g2. g'2 g4 g2 r2 g4 c4. g8 g4. e8 e 
  c g'2 r2 g4 d'4. b4 g8 g2 r4 d2 e8 f 
  | % 30
  g2. b2 g4 g2 r2*19 c1 g2 b4 b a2 r4 a 
  | % 35
  a c4. c8 g2 ais f4 a2. f4 
  | % 36
  g2 e4 g2 d4 g2 r2. c,4 
  | % 37
  e g2 d4 f a2 a4 r4 a e g 
  | % 38
  g2 r2*49 b2 b4 b b2 r2. c4 g2 
  | % 47
  c,4 c2 c4 c2 r2. c4 c4. d8 
  | % 48
  e2 r4 f2 a4 a c4. c8 c4 r4 c, 
  | % 49
  c e r4 g4. g8 g4 r2 g4 g4. g,8 g2 g4 r2 e' a,4 a' a2 r2*7 d,2 
  g4. f8 e4. c8 r4 d a'2 c 
  | % 53
  b2. a4 a1 gis2 a 
  | % 54
  e r1*9 b4 d2 g,4 r4 d' d2 r2 g2. g4 g2 g g r2*29 g2 f4 a4. 
  g8 e4 r2 e4 a2 a4 
  | % 65
  c a a2 r1 e4 a,2. 
  | % 66
  a2 r1 d4 a'2 a4 r4 g 
  | % 67
  g2 g r4 g2 b4 c g2 b4 
  | % 68
  e,2 r2*27 a1 a2 a1*2 r2 e e e e2. d4 
  | % 75
  c2 a b g2. a4 b2 
  | % 76
  c4 a e'2. d4 c2 g4 b2 c8 d 
  | % 77
  e1 r1*13 d2 g,4 d'2 g d4 r4 d2 d4 
  | % 82
  d2 r2. f f4 f a2 
  | % 83
  f r4 c' c2 f,4 a2. f2 
  | % 84
  r4 c' c2 r2. f,4 ais,1 
  | % 85
  r1 ais'2. d4 d2 d, 
  | % 86
  d r2. e a,1 
  | % 87
  r2 d d g,4 g'2 d4 d2 
  | % 88
  r4 e4. f8 g4 g2 r2. c,2 c'4 
  | % 89
  c2 r4 c,2 e4. d8 c4 r4 g'2. 
  | % 90
  d2 g, r2 d' d1*6 
}

cVIa = <<
  \context Voice = voiceA \choirVIAltoX
  \context Voice = voiceB \choirVIAlto
>>


choirVITenorX = {
  
  \set Staff.instrumentName = "cVIt:voiceA"
  

  \key a \minor
  \skip 1*277 
}

choirVITenor = \relative c {
  r2*95 c'2 c c d1 e2 
  | % 17
  f d2. d4 c1 r2 
  | % 18
  c c c f1 f2 
  | % 19
  d r2 d4*5 e8 f e2. c4 e2 a, r2 a b4 a b 
  | % 21
  c d c b a e'1. a,2 b b a1 r2*21 d2 d4 b b2 r4 c2 e4. c8 c4 
  | % 28
  r2 c4 g g2 r2 g'2. e4 
  | % 29
  e2 r4 b b4. a8 g2 r4 g2 b4 
  | % 30
  b2 r2 b2. b4 b2 r2*15 g'1 d2 f1 e2. c4 d2 d1 a2 c d1 a2 c1. 
  d2 g, 
  | % 36
  r4 c4. d8 e f g4 g,2 b4 d d, a'1 g r1*26 g'2 g1 g2 g r2 
  | % 48
  g e c g' c,4 f4. e8 f d 
  | % 49
  e2 r2. g,2 g4 g2 r1 d'2 d4 d d4. f8 e4 c r4 c4. a8 b c 
  | % 51
  d e f4 r4 c g2 r1*2 d'2. g2 e4 g2 d4 f4. e8 d4 
  | % 53
  c4. d8 e2 r2 a,4 e'2 d8 c b4 e 
  | % 54
  e1 r2*17 a,4 d2. d2 r1. 
  | % 58
  g,2. g4 b2 c b r2*29 e2 a, e' r2 e4 a,2 f4 
  | % 65
  a e r4 a2 e4 r4 a c2 f, 
  | % 66
  r1. a4 a2 e4 r4 b' 
  | % 67
  e2 b r4 e, b' b e,2 b' 
  | % 68
  r1*14 e1 e2 e1*2 r2*7 e2 e e g2. f4 e2. d4 c2 a e'2. d4 c b 
  e1 a,2 r1*12 d1. d2. b4 b d2 g,4 b2 a1 r1 c2 c c4 f2 c f,4 a2 
  r2 
  | % 84
  c4*5 a4 r4 d ais f' f2 
  | % 85
  r4 ais,2 d4. c8 ais4 r2. a4. g8 f d 
  | % 86
  d2 r1. d'1 
  | % 87
  d4 d g2. d4 d2 r1 
  | % 88
  e2 e r2 e g g 
  | % 89
  r2 g, c4 c b g d'2 r2 
  | % 90
  d1. d1*6 
}

cVIt = <<
  \context Voice = voiceA \choirVITenorX
  \context Voice = voiceB \choirVITenor
>>


choirVIBaritone = {
  
  \set Staff.instrumentName = "cVIbar:voiceA"
  

  \key a \minor
  \skip 1*277 
}

choirVIBaritone = \relative c {
  r2*103 g'2 g g c c4. ais8 a4. g8 
  | % 19
  f4. e8 d8*7 e8 f g a2 d,4 r4 d'2 g,4 g1*2 e1 e2 e2. c4 g'2 
  r1 
  | % 22
  e2 g r4 c,2 c'4 g e g2 
  | % 23
  c,1 r2*21 g'2 g4 g g2 r2. e4 e2 
  | % 28
  r2 c c4 g'4. f8 e4. d8 c4 c'2 
  | % 29
  r1 g2 g g1 
  | % 30
  g2 r1 g2. g4 d2 
  | % 31
  r1*6 d'1 g,2 b b a1 g1. f4 d a'2. a4 
  | % 35
  g1 r2 c4 f,4. g8 a4 e2 
  | % 36
  r2 g1 c,2 e2. e4 
  | % 37
  d2 r4 d'2. a2 c ais4 g 
  | % 38
  d'2 r2*49 b2 b4 b g2 g2. e2 c e4. f8 g4 r4 c c2 g r2 c4 
  | % 48
  f, f2 r4 c' c2 g4 c2 b8 a d4 
  | % 49
  b d2 r2. d,4 d4. b8 b4 b r4 
  | % 50
  g' g2 r2*7 d1 g2 e4 g2 g4 b d2 a4 r4 e g2 a4 d, e c r4 e g2 
  c,4. d8 e2 r4*35 d4 g2 g r2. d4 d2 d r2*33 g2 a a r2 a a 
  | % 65
  a a a r4 a a2 a 
  | % 66
  r4*7 a2 c4 b2 
  | % 67
  c4 g4. a8 b4 r4 g g g g2 g 
  | % 68
  r1*14 e1 e2 e1*2 r2*9 e2 e e a g a1 e r1*14 g1. g2 g1*2 r2. f2 
  f c a' f4 
  | % 84
  r4 a a2 r4 a c1 r2. f,2 f4 f2 r4 ais2. ais2 r1 a2 d2. d,4 d2 
  r1 
  | % 87
  a'4 d4. c8 a4 r4 d4. g,8 g4 r2 g 
  | % 88
  b4 b4. c8 d4 r2 g, g1 
  | % 89
  g r2 g1 c,2 
  | % 90
  r2. g'2 d d' g,4 d' g, 
  | % 91
  r2 g g1*5 
}

cVIbar = <<

  \clef bass
  
  \context Voice = voiceA \choirVIBaritone
  \context Voice = voiceB \choirVIBaritone
>>


choirVIBassX = {
  
  \set Staff.instrumentName = "cVIb:voiceA"
  

  \key a \minor
  \skip 1*277 
}

choirVIBass = \relative c {
  r2*111 d2 d d g2. f8 e d2 
  | % 20
  g2. f4 e2 a, e'2. e4 
  | % 21
  a,2 r2*33 g2 g g c1 r2 
  | % 28
  g c c g'1 e2 
  | % 29
  e d1. b2 b4. c8 
  | % 30
  d2 r4 g,2 g4 g1 r1. d'1 a2 c c g 
  | % 32
  g4 g d'2 c b4 g2. d'2 
  | % 33
  r2*79 g1 g1. g2 
  | % 47
  g1 r2 g e c 
  | % 48
  f2. f4 c2 c2. e4 c g'2 g4 g2 r2 g g g e e a f g1 a1*2 g2 g 
  g c, f a 
  | % 53
  g2. e4 f4. g8 a4 e4. f8 g a b4 e,2 a4 a2 r2*19 b2 a1 g r4*97 d4 
  a'2 d,4 d e2 d r1*16 a1 cis2 e a, a1 r1*23 g'1. g2 g1 
  | % 82
  r2 d d d f1 
  | % 83
  c r1. f2 
  | % 84
  f f a1 f2 r2 
  | % 85
  d4 f ais,2 d1 r2 d2. d4 d2 c1 f2 f4. e8 d2 r2. d2 d4 g,2 g'1 
  | % 88
  e2 c d e1 c2 
  | % 89
  g' r2 g g r4 g,2 d'4 
  | % 90
  d2 r2 d b d d1*5 
}

cVIb = <<

  \clef bass
  
  \context Voice = voiceA \choirVIBassX
  \context Voice = voiceB \choirVIBass
>>


choirVIISopranoX = {
  
  \set Staff.instrumentName = "cVIIs:voiceA"
  

  \key a \minor
  \skip 1*277 
}

choirVIISoprano = \relative c {
  r1*57 d''1 d2 d e1 
  | % 21
  c2 a e'2. e4 e1 
  | % 22
  r2 d b1 r4 c2 e2. b4 e2 d4 c2 r2 g e 
  | % 24
  a e1 r2*11 g2 c c g' r2 d 
  | % 27
  d4 d e1. d2. c4 
  | % 28
  c1 c2 g r4 g2 f8 e 
  | % 29
  d2. d4 d2 r2 d'1 
  | % 30
  g,2 b1 a2 g4 e f d4. e8 f g a2. f4 g2 e g1 r2 c,4 c g'2. d4 
  d2 r2. d'2 f4. e8 d4 r4 c2 e4 g g,2 
  | % 34
  d'4 d2. a2 f4 g2. f8 e d4 
  | % 35
  f r4 c' f2 e4. d8 c4. a8 b c d2 
  | % 36
  g,4 c a r4 e'4. d8 c4 b g r4 d f 
  | % 37
  d a'2 r4 e g2 r1*26 c4 g'2 e4 e2 r2. c4 g2. g4 g2 r2 g' f2. 
  c4 r4 
  | % 49
  c c a r4 e g c, g'1 r2 g g g4 g'2 g,4. c8 c4 r4 f,4. e8 d4 
  r4 g2 b4 c a e'4. d8 c2 a b1 r2*31 d2 d1 d r2*7 d2. d4 b2 g a 
  r2*7 c2. c4 c2 a4 d2 b4 r2 
  | % 62
  g e4 g2 d4 r2 g e 
  | % 63
  b' e,4 e' e2 r4*25 d4 c8 b a g f4 a a2 r4*19 e'4 c2 c r1 a2 
  e'4 
  | % 69
  e a, a r1*9 e'1 e2 e1*2 r1*23 d1. d2 d2. e8 f 
  | % 82
  g4 g,2 d'4 d1 r2*5 a2 a4 a a c4. ais8 a4. g8 f2 c'4 
  | % 85
  c2 r2*5 
  | % 86
  d2 d4 d d f4. e8 d4 d2 g,4 c4. ais8 g4 d'1 r2. b2 b4 d2. g,4 
  b2 g r4 g' g2 g g g r2 g, c4. d8 e2 r2 
  | % 90
  d4 b2 g b4. a8 g4 r4 d'2 b4 
  | % 91
  r4 g' g2 r4 g2 d g4 g1*3 
}

cVIIs = <<
  \context Voice = voiceA \choirVIISopranoX
  \context Voice = voiceB \choirVIISoprano
>>


choirVIIAltoX = {
  
  \set Staff.instrumentName = "cVIIa:voiceA"
  

  \key a \minor
  \skip 1*277 
}

choirVIIAlto = \relative c {
  r2*111 a''2 a a b1 r2 
  | % 20
  g g g c2. b4 a e 
  | % 21
  a1 g2 r2 f4 a g4. f8 
  | % 22
  e2. a,4 c4. d8 e4 b r4 e f a2. d,4 g r4 g c2 a2. b4 c2 
  | % 24
  f,1 r2*5 g2 g g ais1 a2 
  | % 26
  a ais4. a8 g1 g2 g 
  | % 27
  r2. g2 b4 e,1 r2 
  | % 28
  c' c2. b8 a b1 b2 
  | % 29
  b b2. g4 g1*2 r2*97 g2 c4 c c2 r2. g4 c2 
  | % 48
  g4 g4. g8 g4 r2. c,2 f4. e8 c4 
  | % 49
  r2 c'4 c2 g4 r4 g4. a8 b4 r2 
  | % 50
  b b b c2. c4 a d, 
  | % 51
  a'2. g4 g2. f4 a2. e4 
  | % 52
  f2 g1 r1*15 d4 d2 d4 r4*5 d4 d4. c8 
  | % 58
  b2 r1*3 d4. d8 g4 b4. a8 g f e2 e r2*7 e2. e4 e a4. e8 f4 g2 
  r2 
  | % 62
  g g g r2 g g 
  | % 63
  g c, g r4*25 d'4 e2 f r4*21 g4 c,2 g' r1 d4 a'2 
  | % 69
  c4 f, f r1*9 e1 e2 e1*2 r1*23 g1. g2 g1*2 r2*7 f2 f f4 a2 f4 
  c'1 
  | % 85
  f,2 r4 f2 ais, ais'4. a8 g4 r2 
  | % 86
  d d1 r2. g4. e4 c8 
  | % 87
  c2 r4*5 b2. b4 b 
  | % 88
  g2 g r4*5 g'4 g2 
  | % 89
  g4 g2 c,4 c2 r4 g'4. e8 e4. c8 c2 e4 g2 r4*5 g,2 g' 
  | % 91
  d4 r4 d2. b4 d g, g' g1*4 
}

cVIIa = <<
  \context Voice = voiceA \choirVIIAltoX
  \context Voice = voiceB \choirVIIAlto
>>


choirVIITenorX = {
  
  \set Staff.instrumentName = "cVIIt:voiceA"
  

  \key a \minor
  \skip 1*277 
}

choirVIITenor = \relative c {
  r2*113 d'2 d d g1 r2 
  | % 20
  c, c e e1 e2 
  | % 21
  b r2 d g,4 b e, e'2 c4 
  | % 22
  c2 r1. a2 ais 
  | % 23
  ais c c4 c c2 a a1 r2*5 d2 
  | % 26
  c g' g1 c,2 f 
  | % 27
  ais,4 d2 g,4 g2 r2 e4 e'2 c4 
  | % 28
  c2 r4 g g2 r2 g4 g c2. c4 c2 r2 g' g g g r2. b,2 d, d'4 b4. 
  c8 d2 
  | % 31
  e4 c d1. c b1 r1*42 d2 g,2. g4 g2 r4 g' e2 
  | % 47
  c g'4 g c,2 c4 c2 c4 r4 e2 a,4 a2 r2 e e e r4 
  | % 49
  b'4. g8 g4 r2 g4 g' g g2 d4 r4 
  | % 50
  c4. b8 g4 r2 d' e4 c d2 r2 a e a4 d2 g,4 b1 
  | % 52
  r2*29 d2 g r4 d d2 r2 b 
  | % 58
  d g, r2*5 d'2. d4 g, g2 e4 e2 r2*7 e'2. c4 c2 r4 d b2 r2 
  | % 62
  b4 d c4. a8 b2 r2 b g 
  | % 63
  b e e r1*6 a,4 d2 cis4 d2 r4*21 g4 f2 e r2. g4 f f e2 d r1*9 a1 
  a2 a1*2 r1*23 b2. g2 d' b4. c8 d2 g, d'4 d2 r4 d,2 a'4 f a a2 
  r4 
  | % 83
  c2 c f,4 f'2. c4 c2 r2. f f4 f f2 f r4 d2 
  | % 85
  ais4 ais2 r2. f2 f4 a r2 
  | % 86
  g g4 e2 r4*5 d4 d 
  | % 87
  g g2 d r2. g4. e8 e'4. d8 
  | % 88
  c4 c2 r4 g g2 r2 g c4 
  | % 89
  c c2. c4 r2 g' g4 g g2. g4 r2. g,2 d g f8 e d1*4 
}

cVIIt = <<

  \clef bass
  
  \context Voice = voiceA \choirVIITenorX
  \context Voice = voiceB \choirVIITenor
>>


choirVIIBaritoneX = {
  
  \set Staff.instrumentName = "cVIIbar:voiceA"
  

  \key a \minor
  \skip 1*277 
}

choirVIIBaritone = \relative c {
  r2*109 a'2 a a d2. c4 b2 
  | % 20
  b b2. b4 e,2 e a 
  | % 21
  a c1 g a b2. b4 a1 r2*17 g2 g g g4. a8 ais4 g a2 
  | % 26
  f ais r4 g d2 d r4 g 
  | % 27
  c2. b8 a d2 g, c r4 g 
  | % 28
  e2 g4 c,2 g'4 r4 d'4. b8 b4 r2 
  | % 29
  b b1 r2 g2. g4 
  | % 30
  d'2 r2 c f, f d 
  | % 31
  a' r1. d1 
  | % 32
  g,2 b1 a2 g r2*79 g2. c2 c4 c2 r4 g2 e c g' c,4 c2 r2 c4 c2 
  | % 48
  c4 r4 a' a a g e e2 r2 d8 d 
  | % 49
  d4 r2 d' d4. g,8 g4 g g g r1 f2 c4 e r4 g c,2 c' c 
  | % 52
  f,4 a r4 d d2 r1*15 g,2 d d r2. d4 d'2 
  | % 58
  g, d' r4 g, g2 r2*15 e4. e8 a4 c4. b8 a g f4 d d2 r2 
  | % 62
  b e b r2 b e 
  | % 63
  b c4 e4. f8 g4 r4*25 d4 a'2 d, r4*21 e4 f2 g r1 f4 d e 
  | % 69
  a2 a4 r1*9 cis1 a2 a1*2 r1*23 b1. b2 b1 
  | % 82
  r2 g f d4 d a'2 f 
  | % 83
  f1*2 f1 
  | % 84
  r2 f1 c'4 f, f1 
  | % 85
  r2. d2 g4 g2 r4 a4. g8 f4. d8 d'4 d2 r4*5 d,4. e8 fis4 r2 g2. 
  g4 g g g2 g r2. e4 e2 r2 c2. g'4. f8 e4. d8 
  | % 89
  c4 c'2 r1 g1. g1 r1 b 
  | % 92
  b1*4 
}

cVIIbar = <<

  \clef bass
  
  \context Voice = voiceA \choirVIIBaritoneX
  \context Voice = voiceB \choirVIIBaritone
>>


choirVIIBassX = {
  
  \set Staff.instrumentName = "cVIIb:voiceA"
  

  \key a \minor
  \skip 1*277 
}

choirVIIBass = \relative c {
  r1*57 g1 g2 g c1 
  | % 21
  r2 a a a e'1 
  | % 22
  d2 f e2. e4 a,1 
  | % 23
  r2*15 d2 d4 d g1 c,2 g1 r1. d'2 g,4 g g'1 e2 c d e1 c2 
  | % 28
  g' r2 g g r4 g, g d' 
  | % 29
  d2 r2 d4 d b2 d d1 r2*11 g1 d2 f e d 
  | % 33
  f1 c2 e e d1 f e4 c g'2 r1. c,1 g2 b a c1 g2 d'1 f2 c r2*51 g'1 
  e2 e c r4 c 
  | % 47
  g'2 g4 g2 e4 e2. e4 e2 
  | % 48
  r2 c c a e'2. e4 
  | % 49
  d4. c8 b2 r2 b' b4 g g2 
  | % 50
  c,4 e4. f8 g4 r2*41 g2 f4 d r4 d2 b4. a8 g4 d'2 
  | % 58
  r1*9 a'2. a4 a2 a g r2 
  | % 62
  g g g r2 g g 
  | % 63
  g e e r4*51 g4 a2 e r1 a4 a2 
  | % 69
  a4 f d r1*9 a1 cis2 e a, a1 r1*23 g1 b2 d1 b4 g 
  | % 82
  d'2 g, r2*7 c2 c c f c a'1 f2 r2 d4 f ais,2 d1 
  | % 86
  r2 d2. d4 d d c2 c 
  | % 87
  f f4. e8 d2 r2. d2 d4 
  | % 88
  g, g g'1 e2 c d 
  | % 89
  e1 c2 g' r2 g 
  | % 90
  g r4 g,2 d'4 d2 r2 d 
  | % 91
  b d d1*5 
}

cVIIb = <<

  \clef bass
  
  \context Voice = voiceA \choirVIIBassX
  \context Voice = voiceB \choirVIIBass
>>


choirVIIISopranoX = {
  
  \set Staff.instrumentName = "cVIIIs:voiceA"
  

  \key a \minor
  \skip 1*277 
}

choirVIIISoprano = \relative c {
  r2*129 e''2 e e g1 f2 
  | % 23
  e2. d4 d1 c4 b c4. d8 
  | % 24
  e4 a,2 b8 c d2 r1. 
  | % 25
  d2 d d e1. 
  | % 26
  d2. c4 c1 b 
  | % 27
  g2 g1 r1. 
  | % 28
  g'2 g g g r4 g,2 d' d d4 d1 b2 b1 r2*9 g'1 d2 f e d 
  | % 33
  d a c b4 a8 g f4 d a'2. f4 g2 e r2. f a2 e g r2*67 g1 c c2 
  c 
  | % 47
  r4 c2 e c e4. e8 e4 r4 a, 
  | % 48
  c f, r4 a4. e8 e4 r2. g2 d'4 
  | % 49
  g, d' r2 d d d e 
  | % 50
  e f1 e2 d c1 a2 d d1 r1*15 g,4 d'2 d4. a8 a4 r2 b4 g4. a8 b4 
  | % 58
  b2 r1*3 b2. b4 d2 e c r2*7 e2. e4 a,2 d d r2 
  | % 62
  d g, d' r2 d g, 
  | % 63
  d'4. g,8 a b c a b2 r4*25 f'4 e2 d r4*21 c4 c4. d8 e2 r1 a,4 
  d2 
  | % 69
  cis4 d d r1*9 cis2. b4 a2. g8 f e4 a8*5 b8 
  | % 73
  c d e4 r1*23 g1. g2 g d 
  | % 82
  d d f1. c1 f,2. c'4 c2 r2 a a4 a 
  | % 84
  a c2. a4 c r4 ais4. a8 f4 f2 
  | % 85
  r1 d'2 d,4 f2. f2 
  | % 86
  r2. g4. e8 e4 r4 a a2 r2. d d4 d g1 g2 r2 g, g4 g g c c2 r2 g4 
  e2 e'4. f8 g2 d g,4 b d r4 d, g 
  | % 91
  d r4 g2 d'4 b d d1*5 
}

cVIIIs = <<
  \context Voice = voiceA \choirVIIISopranoX
  \context Voice = voiceB \choirVIIISoprano
>>


choirVIIIAltoX = {
  
  \set Staff.instrumentName = "cVIIIa:voiceA"
  

  \key a \minor
  \skip 1*277 
}

choirVIIIAlto = \relative c {
  r2*131 a''2 a g c1 ais2. g4 a2 a a1*2 r2*5 g2 
  | % 25
  e2. g d2 r4 a2 a4 
  | % 26
  d2 b4 g'2 g4. a8 b4 r2. e, b2 r2 c2. e4 c g'2 g4 
  | % 29
  g2 r2 b, b b2. d4 
  | % 30
  d2 r2 g2. b4 g2 r2*5 c1 g2 b b a 
  | % 32
  r4 g g b4. a8 g2 f4 g2 r2. d2 a c g4 c2 r2 f a4. g8 f2 c' r2*67 g2 
  g2. e2 c4 e g r4 g 
  | % 47
  c2. g2 g e4 e2 r4 e 
  | % 48
  a2 a4 a2 a4 a2 r4*5 g4. d8 d4 r2 d4 g,4. g'8 g4 g g4. c,8 
  | % 50
  c4 r2. d2 a'4. g8 c4 r2 c,4. d8 e4 a,2 a' d,4 d1 r1*15 g4 g2 
  g4 r2 d' d4. b8 b2 
  | % 58
  r2*7 g2. g4 g2 g c, r2*7 a'2. a4 a2 a b r2 
  | % 62
  b c b r2 b c4 g4. f8 d4 a'2 g r1*6 f4 a4. g8 e4 a2 r4*21 c4 
  a4. b8 c2 r1 f,4. g8 a4 
  | % 69
  a a a r1*9 a2. e2 a, a' e f8 g 
  | % 73
  a2 r1*23 b1. b2 b1*2 r2 a a a c a 
  | % 83
  a1 r4 f2 f4 f2 a2. f4 f2 r2 f ais, r4 g'2. g2 r4*5 d4. ais4 
  g4. g'4 
  | % 87
  g2 r1 g2 g4 g b2. g4 g2 r4 g c, e r4 e e2 r4 
  | % 89
  g c, g' g2 r2 g c, r2. g'4. b8 b4. g8 g4 r4 d d2 r4 b g2 r4 g'2 
  d4 g4. a8 b2 g4 b b1*3 
}

cVIIIa = <<
  \context Voice = voiceA \choirVIIIAltoX
  \context Voice = voiceB \choirVIIIAlto
>>


choirVIIITenorX = {
  
  \set Staff.instrumentName = "cVIIIt:voiceA"
  

  \key a \minor
  \skip 1*277 
}

choirVIIITenor = \relative c {
  r2*133 e'2 c c g' d4 d e2. e4 e1 r2*7 b2 c c d2. e4 f1 g2 d1 
  d2 g,1 
  | % 28
  r2 g' g g c,2. e4 
  | % 29
  e1 r2. d2 d4. c8 b4 
  | % 30
  r4 g2 g4 g1 r1. g'1 d2 f f e4 e2 c4 d2. g,4 a4. b8 c4 g2 d'4 
  b 
  | % 33
  d r4 d2 c4 d2. d4 d2 c4 
  | % 34
  a r4 c e g2 d4 r4 d d f2 
  | % 35
  c4 c2 ais4 g d'2 r1*35 e2 e2. e4 e1 r4 g2 e4 a, c4. c8 c4 r2 e4 
  e4. c8 c4 r4 
  | % 49
  g'4. d8 d4. b8 b4 r2 b b4. b8 b4 
  | % 50
  b r4 e2 e4 r2 a,4. b8 c4 g b 
  | % 51
  g r4 c2 f4 e2 d4. c8 b1 r1*15 g'4 d2 b4 r2 d d r1*4 g,2. g4 
  b2 c a r2*7 c2. c4 e2 f d r2 
  | % 62
  d e d r2 d e 
  | % 63
  d c b r4*25 a4. b8 c4 f,2 r4*21 c'4 c2 c r1 d4 a a 
  | % 69
  a4. d,8 a'4 r1*9 e'1 e2 e1*2 r1*23 d1. d2 d1*2 r4*11 c2 c4 
  c2 c4 f2 c4 c1 c r2. ais4. a8 f4 ais2. g4 r4 d'4. a8 a4. d,8 
  d4 r4 a' d2 r4 g, g2 r2 a b b b4 g d'1 
  | % 88
  b2 e1 r2 d4 g, g2 
  | % 89
  r4 e'2. e4 e, e4. f8 g4 e r4 g 
  | % 90
  d d'2 b4 r4 g2 g' g4. d8 g4 
  | % 91
  g2 r1 g g1*3 
}

cVIIIt = <<
  \context Voice = voiceA \choirVIIITenorX
  \context Voice = voiceB \choirVIIITenor
>>


choirVIIIBaritoneX = {
  
  \set Staff.instrumentName = "cVIIIbar:voiceA"
  

  \key a \minor
  \skip 1*277 
}

choirVIIIBaritone = \relative c {
  r2*131 e2 e e a1 g2 
  | % 23
  ais a2. a4 a1*2 r1. d1 b2 
  | % 26
  g c1 ais2 c1 
  | % 27
  d2. b4 b2 r4 g2 c c,4. d8 e4 r2 e4 g2 c, c'4 c g g1 r2 d1 d2 
  d1*2 r2 d'1 g,2 b b 
  | % 31
  a1 g2. g4 g2 g 
  | % 32
  f g4 e g1 r1. f2 d f r2. g 
  | % 34
  d4 f2 d4 a'2 r1*35 e2. g2 c, e g4 g c 
  | % 48
  c g g1 r4*5 a4 
  | % 49
  a a r4 e4. e8 c4 r2. d4. d8 d4 
  | % 50
  r2 d2. g4 g b g g2 c,4 
  | % 51
  r4 f4. g8 a4 e g2 d4 e c2 d4 
  | % 52
  e c f4. e8 d1 r1*15 g2 d' r2. d4. g,8 g4 r4 g 
  | % 58
  b g4. f8 d4 r2*5 g2. g4 g2 c, c r2*7 e2. e4 e2 d d r2 
  | % 62
  d4 g2 c,4 d2 r2 d4 g2 c,4 
  | % 63
  d2 e4 c g'2 r4*25 a4 a2 a r2*11 a4 c2 g4 r1 a2 c4 c 
  | % 69
  a f r1*9 a1 a2 a1*2 r1*23 d,1. d2 d1*2 r1. a'2 a a 
  | % 84
  c a a1 r2 a 
  | % 85
  a a d d r4 d2 g,4 
  | % 86
  d'1 r2 a a r2. g4 c2 r4 f, d a' r4 g d2 r2 d1 d4 d r4 g c2. 
  b8 a 
  | % 89
  d2 g, c r4 g e2 g4 c,2 g'4 r4 d'4. b8 b4 r2 b b1 r2 g1. g1*4 
}

cVIIIbar = <<

  \clef bass
  
  \context Voice = voiceA \choirVIIIBaritoneX
  \context Voice = voiceB \choirVIIIBaritone
>>


choirVIIIBassX = {
  
  \set Staff.instrumentName = "cVIIIb:voiceA"
  

  \key a \minor
  \skip 1*277 
}

choirVIIIBass = \relative c {
  r2*149 g2 c c g'1 f2 
  | % 26
  a g2. g4 g2 g g1 e4 c g'1 c,2 c1*2 g1 g1*2 
  | % 30
  r2 g'1 d2 f e 
  | % 31
  d f1 c2 e e 
  | % 32
  d1. e4 c d2 d1 e2 f2. g4 a f a2 e4 g2 c,4 g'2 r2*71 g,1 c1. 
  c2 
  | % 47
  c1*2 r2 c 
  | % 48
  a f a1 c 
  | % 49
  g r2 g g g 
  | % 50
  c c d1 c2 b 
  | % 51
  a2. b4 c2 d g,1 
  | % 52
  r2*31 d'2 d1 d1*2 r2*17 a2. a4 c2 d g, r2 
  | % 62
  g c g r2 g c 
  | % 63
  g c4 a e'2 r4*51 c4 f2 c f, r4 c' d d a2 d r1*9 a1 a2 a1*2 
  r1*23 g1. g2 g1*2 r1. f2 f f 
  | % 84
  a f f1 r2 f 
  | % 85
  f f ais1. g1 ais2 d1. g,2 c 
  | % 87
  e d1 g, r2 
  | % 88
  g1 d'4. f8 e4. d8 c1 
  | % 89
  b2 c g'1 c,2 c1 d2 b r4 d2 g,4 g1*7 
}

cVIIIb = <<

  \clef bass
  
  \context Voice = voiceA \choirVIIIBassX
  \context Voice = voiceB \choirVIIIBass
>>


\score {
  <<
    \context Staff=cIs \trackA
    \context Staff=cIs \cIs
    \context Staff=cIa \trackA
    \context Staff=cIa \cIa
    \context Staff=cIt \trackA
    \context Staff=cIt \cIt
    \context Staff=cIbar \trackA
    \context Staff=cIbar \cIbar
    \context Staff=cIb \trackA
    \context Staff=cIb \cIb
    \context Staff=cIIs \trackA
    \context Staff=cIIs \cIIs
    \context Staff=cIIa \trackA
    \context Staff=cIIa \cIIa
    \context Staff=cIIt \trackA
    \context Staff=cIIt \cIIt
    \context Staff=cIIbar \trackA
    \context Staff=cIIbar \cIIbar
    \context Staff=cIIb \trackA
    \context Staff=cIIb \cIIb
    \context Staff=cIIIs \trackA
    \context Staff=cIIIs \cIIIs
    \context Staff=cIIIa \trackA
    \context Staff=cIIIa \cIIIa
    \context Staff=cIIIt \trackA
    \context Staff=cIIIt \cIIIt
    \context Staff=cIIIbar \trackA
    \context Staff=cIIIbar \cIIIbar
    \context Staff=cIIIb \trackA
    \context Staff=cIIIb \cIIIb
    \context Staff=cIVs \trackA
    \context Staff=cIVs \cIVs
    \context Staff=cIVa \trackA
    \context Staff=cIVa \cIVa
    \context Staff=cIVt \trackA
    \context Staff=cIVt \cIVt
    \context Staff=cIVbar \trackA
    \context Staff=cIVbar \cIVbar
    \context Staff=cIVb \trackA
    \context Staff=cIVb \cIVb
    \context Staff=cVs \trackA
    \context Staff=cVs \cVs
    \context Staff=cVa \trackA
    \context Staff=cVa \cVa
    \context Staff=cVt \trackA
    \context Staff=cVt \cVt
    \context Staff=cVbar \trackA
    \context Staff=cVbar \cVbar
    \context Staff=cVb \trackA
    \context Staff=cVb \cVb
    \context Staff=cVIs \trackA
    \context Staff=cVIs \cVIs
    \context Staff=cVIa \trackA
    \context Staff=cVIa \cVIa
    \context Staff=cVIt \trackA
    \context Staff=cVIt \cVIt
    \context Staff=cVIbar \trackA
    \context Staff=cVIbar \cVIbar
    \context Staff=cVIb \trackA
    \context Staff=cVIb \cVIb
    \context Staff=cVIIs \trackA
    \context Staff=cVIIs \cVIIs
    \context Staff=cVIIa \trackA
    \context Staff=cVIIa \cVIIa
    \context Staff=cVIIt \trackA
    \context Staff=cVIIt \cVIIt
    \context Staff=cVIIbar \trackA
    \context Staff=cVIIbar \cVIIbar
    \context Staff=cVIIb \trackA
    \context Staff=cVIIb \cVIIb
    \context Staff=cVIIIs \trackA
    \context Staff=cVIIIs \cVIIIs
    \context Staff=cVIIIa \trackA
    \context Staff=cVIIIa \cVIIIa
    \context Staff=cVIIIt \trackA
    \context Staff=cVIIIt \cVIIIt
    \context Staff=cVIIIbar \trackA
    \context Staff=cVIIIbar \cVIIIbar
    \context Staff=cVIIIb \trackA
    \context Staff=cVIIIb \cVIIIb
  >>
  \layout {}
  \midi {}
}
