\version "2.24.3"

ficta = { \once \set suggestAccidentals = ##t }

% ------------
% Choir 1
% ------------

notesISoprano = \relative c {
  r1 d''1. %tie1.
   d2 d d 
  a c c e2. %tie2.
   d4 d1 c2 
  |b2. a4 g2 d 
  |g a2. a4 d,2 
  |r2 d'2. c4 c1 %tie
   f,2 c'4. b8 a4 g 
  f2 f'2. e4 d2. %tie2.
   a2 d d, a'2 %tie44
   e4 r4 g c2 g' 
  |f4. e8 d4 c b2 g 
  |d'1 r1 
  |r2 d d4 d2 a4 
  | %15
  \barNumberCheck #15
  |a2 r4 f c' e2 c4 
  |e2 r4 a, a e'2 c4 
  |f2 f4. e8 d4 a a1 %tie
   d,2 a'2. a4 
  |a2 r2 r4 g2 b4 
  |d a2 d g,4 r4 d'2 %tie44 
  e8 fis g2. d4 d2 
  |r1 d,2 a' 
  |r4 d b2. g4 d'2 
  |g, c1 a2 
  |a1 r1 
  | %26
  \barNumberCheck #26
  R\breve*14
  |r2 d2 b b 
  |e,1 r2 b' 
  |e r4 e,2 e4 e2. %tie2.
   e4 e2 r4 d g2. %tie2.
   b2 g4 r4 d'2 g4 
  |g1 r1
  |
  R\breve*19 
  | r1 d1 
  | %66
  \barNumberCheck #66
  |e1. e2 
  |e1 r2 e 
  |e d c2. c4 
  b1 r2 g2. %tie2.
   g4. e8 e4 r4 c2 g'4. %tie4.
   e8  e2 c'4. c8 c4 r4 e2 %tie44
  e4. f8 g4 r4 c, f, c'4. %tie4.
   a8  a2 g8 f g2 r4 g2 %tie44
   g4 d'2 r2 d 
  d4. d8 d4 d r2 g,1 %tie
   f2 r4 g d'2 
  | R\breve*4
  |r2 c2 f2. f4 
  | e d d2 c4 a2 g8 f 
  e2  r4 a4. b8 \ficta cis d e4 a,2 %tie44
   d4  d2 r1 
  | %85
  \barNumberCheck #85
  |r2 e2 d1 
  |d2  d4 g2 f8 e d4. c8 
  |b1 r1
  | R\breve*3 
  |r2 c2. c4 e2 
  |f  e r1 
  | %93
  \barNumberCheck #93
  |r2 d2 e d 
  |r2 d e d 
  |c b r1
  | R\breve*5
  | r1 r2 r4 g'4 
  |f2 e r2 r4 g4 
  |f4 f e2 d r2
  |r1 a4 d2 \ficta cis4 d2
  r1 e2 b4 d 
  g,4 c b2  g r2 
  r4 g4 g4. a8  b c d4 g,1 %tie22
  r2 e'1 
   e2 e\breve %tie11
    r1
  | R\breve*6
  | r1 r2 d2 
  |d d4 d g2. f4 
  |e2 d c b 
  |a d2. c4 b g 
  | %121
  \barNumberCheck #121
  |a1 r1 
  |b1. b2 
  |b r4 g2 b4 b2 
  |R\breve
  |  r2 c2 c c4 c f1 c 
  |r4 a2 f4. d8 d'2. 
  |d2 r2 r4 bes2. 
  | f'2 f,4 a2 d, g4 
  |g1 r1 
  |r2 d'2. b4 b2 
  |b4 d2 b4 r2 r4 c4. %tie4.
   g8 g4. d8 d4 r2 r4 g4 
  |e e'2 e4 e c c2 
  |r2 r4 g4 d'2. g4 
  |g2 r4  g2 d4 d2 
  d\longa
}

notesIAlto = \relative c {
  g''1. g2 
  g g d f 
  f a1 g2 
  f1 e 
  d2. c4 b g b1 %tie
   a2 a2. b8 c 
  | %7
  \barNumberCheck #7
  d1 r2 g 
  e f4 d e1
  f2 a2. g4 f e 
  | %10
  \barNumberCheck #10
  d2 a r4 a'2 a4 
  a a e g2 g4 g1 %tie
  \ficta fis2 g b 
  | %13
  \barNumberCheck #13
  b b2. a4 g2 
  r2 r4 a2 a4 a2 
  a4 d,2 a'4 a c2 g4 
  g2 r2 e e4 a2 %tie44
   d,4 f2 f4. g8 a4 f2 %tie44
   d4 d2. a4 d a 
  | %19
  \barNumberCheck #19
  a2 r2 r2 d2 
  a d r2 d4 g2 %tie44
   d4 d2. d4 a2 
  | %22
  \barNumberCheck #22
  r1 a4 d4. e8 f4 
  r4 d2 g,4 g'2. g4 
  g1 r1
  | %25
  \barNumberCheck #25
  | R\breve*15
  
  | %40
  \barNumberCheck #40
  r2 d2 d4 g g2 
  r4 g2 e4 g c, r4 g'4. %tie4.
  e8 e4. f8 g4 r2 r4 c,4 
  e g2 g4 r4 d d g2 %tie44
   g4 g2 r2 r4 d4. %tie4.
  b8 b2 g4 d'1
  | R\breve*19
  
  r1 d1 
  c2. d4 e f g2 
  r2 c, g' g 
  a2. a4 g1. %tie1.
  g2. a4 b2 
  c1. g2 
  g r4 g g2 g4 c4. %tie4.
  c8 c4 c, e f a4. a8 f4 
  r2 e4 e2 e4 r2 
  | g4. g8 g2 r2 b 
  | %75
  \barNumberCheck #75
  b4. b8 b4 b r4 g g2 
  | %76
  \barNumberCheck #76
  | R\breve*5
  
  | %81
  \barNumberCheck #81
  | r2 a2 a a 
  b b c1 
  c2 a a1 
  a r1
  r2 c2 a1 
  b2 g1 \ficta fis2 
  g1 r1
  | R\breve*3
  
  | %91
  \barNumberCheck #91
  r2 a2. a4 a2 
  a a r1
  | r2 g2 g g 
  r2 g g g4 g2 %tie44
  g,2 d'4 r4 e g2 
  | R\breve*4
  
  | r1 r4 b4 c g 
  |r4 d g c, r4 g'2 c4 
  |f, a g c, c2 r4 c 
  |c c e2 a, r2
  | r1 a'4 a4. g8 e4 
  |r4 a e a,2 a'4 a e 
  |g2 g r4 g g2  
  |g2 r2 r4 g4 g2. %tie2.
  c4 c2 r2 a1 %tie
   a2 a\breve %tie11
    r1
  | R\breve*6
  | r1 d,2 d2 
  |d4 d g2. f4 e2 
  |r2 d g, d'4. e8 
  f4 g a2 d,\breve %tie11
     r1 
  |d1. d2 
  | d\breve 
  R\breve
  | %125
  \barNumberCheck #125
  a'2 a a4 a c1 %tie22
  a4 f f1 
  |r2 f2. bes,4 bes'2 
  bes r4 bes,2. bes2 
  | r4 d a2 a r2 
  c4 g'2 c,4. a8 a'4 a2 
  r1 r2 g2 
  g4 g4. a8 b4 r2 r4 e,4
  | e2 b2 r2 c2. %tie2.
  e4 c g' g1 
  |r2 b,2. b4 b2 
  | b4 d2 d4 r2 g1 %tie22
  d2 d\breve.
}

notesITenor = \relative c {
  R\breve*4
  r1 d'1. %tie1.
  d2 d d
  a a c e2. %tie2.
  d4 d1 \ficta cis2
  d a r2 d4 d
  f1. d2
  e2. d4 c2 b
  a1 g
  r2 g4 g d'2 d,
  d1 r2 d
  d4 a'2 f4 a a e2
  r4 e f a2 e4 e'2

  | %17
  \barNumberCheck #17
  r2 a, d4 f4. f8 e4
  d2 r4 d,4 d a'2 f4
  r4 c' c4. d8 e2 r2
  r2 d2 d4 g2 g,4
  d'4. c8 b2 g4 d'2 a4
  r1 d4 f4. e8 d2 %tie44
   d4. c8 b4 b4. a8 g2
  g1 r1
  R\breve*15

  | %40
  \barNumberCheck #40 
  r2 b2 b4 b b2 
  r2 e, e r2 
  g4 g g2 r2 e 
  e' e b4 d g, b2 %tie44
  b4 b2 r2 r4 d,4 
  g4 b g d'2 b4 d2
  | R\breve*19

  | %65
  \barNumberCheck #65
  r1 g,1
  g2 e e1
  r2 c' c c

  | %68
  \barNumberCheck #68
  c4 c a2 r1
  r1 d1
  e2. e4 e1
  g2 e c g'2. %tie21
  c,4 c2 r2 r4 c4
  | c2 c4 c4. g8 g4 r2
  d'4. g,8 g2 r2 g'
  | g g4 g4. f8 e4. d8 c4
  | R\breve*5

  %81
  \barNumberCheck #81
  | r2 c2 a a4 d4. %tie4.
  c8 b4. a8 g4 r4 c a e'2. %tie42
  a,2 r4 a8 b \ficta cis d e4
  f d d2 r1
  | r2 c2 f4. e8 d4. c8
  b2 r2 a4 d2 a4
  r4 d b g g2 r2
  | R\breve*3

  % 91
  \barNumberCheck #91
  | r2 e'2. e4 e2
  r4 a,2 e'4 e2 r2
  r2 d2 g d
  r2 d g d4 g,2 %tie44
  g'4 g2 r1
  | %96
  \barNumberCheck #96
  R\breve*4

  %100
  \barNumberCheck #100
  | r1 r4 d4 c2
  |b r4 e d d c2
  |a4 f c'2 r2 r4 e4
  |f f g2 d r2
  |r1 r4 f4 e2
  | d r2 r4 f4 e e
  |d2 c r4 b e2
  |d4 c2 b4 e2 d
  |c1 r2 cis1 %tie22
  cis2 cis1
  | R\breve*8

  %118
  \barNumberCheck #118
  | r2 d2 e c4 c
  |g'2. f4 e2 d2
  | d4 c4 b a g2 r4 d2 %tie44
  fis4 fis2 r1
  g2. b2 g d'2 %tie44
  g,4 b2 b1
  |r1 r2 c2
  | %125
  \barNumberCheck #125
  |c4 c c f2 c4 r4 c
  |a f c'2 r4 a4 a a
  |a4 c2. f,4 f'2.
  |f2 r4 d2 g,4 g2
  |r4 d2. d1
  | %130
  \barNumberCheck #130
  r4*5 d'2.
  d2 r1 d2
  d d4 d g,2 g
  r2 g' g g4 g
  c,2. e4 e1
  r2 r4 d2 d4. c8 b4
  r4 g2. g1
  | %137
  \barNumberCheck #137
  r2 b b\breve.
}

notesIBaritone = \relative c {
  R\breve*4 
  g'1. g2 
  g f d f1 %tie22
  a1 g1 %tie
   f2 e1 
  d a'2 d, 
  a'1 r2 d, 
  a'4 c2 c,4. d8 e c d2 
  r4 d a' d4. 
  c8 b2 g4 
  b2. d2 g,4 r4 d' 
  b2 a1 d,2 
  d'2. d,4 e2 c 
  r2 a' c1 
  r2 f,2. f2 a2 %tie44
  d,4 a' d2 c8 b a2 
  r2 c4 c,2 g'2 %tie44
  d4 
  r4 d' 
  d2. d,4 g d 
  d1 r1 
  g2 c r4 f, a2 
  r4 d,2 d'4 d1
  | %24
  \barNumberCheck #24
  R\breve*16
  % \break
  | %40
  \barNumberCheck #40 
  r2 g,2 g4 b b2 
  r4 g 
  c, g'2 c4 r2 
  c2. g4 g1 
  r2 g g1 
  r2 g 
  g4. a8 b4. c8 
  d2. b4 b1 
  | %46
  \barNumberCheck #46
  R\breve*19
  % \break
  | r1 g1 
  g1. g2 
  g1 r1
  R\breve 
  r1 g1 
  g2 g  c,4 e2 g4 
  g c2 c4 c1 
  r2 c,4 c2 c4 r4 a'2 %tie44
   a4 a2 r1 
  b4. b8 b2 r2 g 
  | %75
  \barNumberCheck #75
  g2. g4 g2 g 
  d'1 g,2 r2
  | R\breve*4 
  | %81
  \barNumberCheck #81
  r2 a2 d, f 
  g g a1 
  g2 f e1 
  | d r1
  r2 a'2 a d, 
  d r1 d2 
  d1. g2 
  g r2 r1
  R\breve*2 
  r2 c2. c4 a2 
  a a r1
  r2g2 g g 
  r2 g g g 
  g g r1 
  R\breve*4
  % \break
  | %100
  \barNumberCheck #100
  r1 r2 e4 g2 %tie44
   d4 r2 d4 g2 c,4 
  f2 c r2 r4 c4 
  f f c2 f r1 
  r2 d4 a'4. e8 a4 
  a2 r2 r4 a4 c c 
  b2 e,4 g2 d4 r4 g2 %tie44
  e2 g4. f8 e4 r4 g2 %tie44
   c,4 g'2 r2 e1 %tie
   e2 e\breve %tie11
    r1
  R\breve*7
  %118
  \barNumberCheck #118
  | r1 r2 g2 
  g d4 d g1 a b 
  a r1 
  g2. f8 e d2 b 
  b\breve 
  | %124
  \barNumberCheck #124
  |r1 r2 c2 
  |c4 f f a2 f4 f2 
  |c'1 a2 c 
  |r2 f, f4 bes bes d2 %tie44
   d4 bes4. a8 g4 d2 g4 
  |r2 r4 f4 f2 r4 g4. %tie4.
   c,8 e4 r2 r4 d4 d2 
  |r2 d' b b4 b 
  |g2 d r1 
  |r2 d4 g2 e e4 
  |e4. f8 g2 r4 c2 c4 
  |r4 b2 g4 g2 r4 g2 %tie44
  d'4. g,8 b4. c8 d4 d, g4. %tie4.
   a8 b2 g4 g\breve.
}

notesIBass = \relative c {
  R\breve*5
  r2 d1 d2 
  d d a c1 %tie
   d2 a a 
  d1 f1. %tie1.
   d2 f1 
  e2 c4 g' e4. f8 g2 
  r2 d d g1 %tie22
  d2 d2. g,4 
  g2 r4 d' a'2. a4 
  d,1 r1
  r2 d2 e a2. %tie2.
   a4 d,1 a'2 
  | a a2. a4 d,2 
  r2 g e r4 d 
  d a'2 d,4 r4 g g2. %tie2.
   g,4 d' g, d'2 r2 
  |  r1 r4 a'2 d,2 %tie44
   g2 f8 e d2 g, 
  | r2  c4 c c1
  | R\breve*15

  %40
  \barNumberCheck #40
  r2 d2 d g,4 g'2 %tie44
   c,4 e2. g4. g8 
  d4 r4 g2 e4. f8 g2 c,2 %tie44
   g'4 g2 r4 g2 d2 %tie44
  g,4 d'1 g2 
  g\breve
  R\breve*23

  | %69
  \barNumberCheck #69
  | r1 g2 g2. %tie2.
   c,4 c e e2 c 
  r4 g'2 e c g'2 %tie44
   g4 g2 a4 a2 a4 
  e a, c1 c2 
  d1 r2 g 
  b2. g4 g c, g'2. %tie2.
  f4 d2 r1
  | R\breve*4 

  r1 r2 d2 
  g, b a2. a4 
  c2 f,4 f a1 
  d r1
  r2 a2 d1 
  g,2 r4 d' f2 f4. e8 
  d4 g, g2 r1
   R\breve*12
   | %100
  \barNumberCheck #100
   |  r1 r4 g'4 g2 
   g r4 g g g e2 
  d r2 r1
  | R\breve
  |r1 r4 d4 a'2 
  |d, r4 r2 a'4 a a 
  |d,2 e4 c g'2 c, 
  |g4 c2 g4 c2 g 
  c1 r2 e1 %tie22
   a2 a,2. b4 
  c a e'2 r1
  | R\breve*11

  %122
  \barNumberCheck #122
  g1. d2 
  g\breve 
  R\breve
  | %125
  \barNumberCheck #125
  c,2 c c2. f4
  |f2 c2 r2 f 
  |f a4 a bes2 f 
  | r2 d bes d 
  r2 f d bes 
  |r2 g' f4 a2 d,4 
  |d1 r1
  |r2 g2 g g4 g 
  |g4. a8 b2 g r2
  |r2 c,2 g' e 
  |r2 g g, g' 
  |g2. f8 e d1
  d\longa
}

% ------------
% Choir 2
% ------------

notesIISoprano = \relative c {
  R\breve*7
  | r2 a''1 a2 
  a a d, f 
  f a1 f2 
  c' c2. g4 b g 
  a1 r2 d 
  |d4 b2 g d'4. c8 b2 %tie44
   g4 a2 r4 f'2 d4 
  f4. f8 f2 r4 c g c 
  |c2 r2 e2. a,2 %tie44
  d2 d4 d2 d2
  |d2 d2. f4 d2 
  r4 e2 e4 g2 r4 d 
  d4. e8 f4 d r4 d g, b2 %tie44
  b4. c8 d4 r4 d, d2 
  |r4 g2 c4 f, a r4 d4. %tie4.
  b8 b2 g d'4 r4 g,2 %tie44
   e4 e2 r4 a c f2 %tie44
   c4 c2 r1
  R\breve*14
  
  %40
  \barNumberCheck #40
  | r2 g'2 g g 
  g2 r2 g, g4 g2 %tie44
   c4 c2 r2 g4 e2 %tie44
   e'4. f8 g2 d g,4 
  b d r4 d, g d r4 g2 %tie44
   d'4 b d d1 
  R\breve*19
  
  %65
  \barNumberCheck #65
  | r1 b1 
  c1. c2 
  c1 g2 c1 %tie
   d2 e2. c4 
  d1 d2 g1 %tie
   g2 g1 
  r2 g e c 
  e4 g2 c,4 c2 r2
  r4 a4 e'2 e4 e4. e8 e4 
  r4 b8 b g2 r2 g 
  d4. d8 d4 g r4 c,4. d8 e4 
  R\breve*5
  
  %81
  \barNumberCheck #81
  | r2 r4 a2 d d4 
  b4 g d'4. e8 f2 e2. %tie2.
   d4 d1 \ficta cis2 
  d1 r1
  r2 a2 f4 a2 d,2 %tie44
  g4 b4. c8 d2 r4 d2 %tie44
  g2 f8 e d2 r2
  R\breve*3
  
  %91
  \barNumberCheck #91
  r2 e2. e4 c2 
  a4 f c'2 r1
  r2 b4 d c4. a8 b2 
  r2 b4 d c4. a8 b4 g 
  g2 r2 r1
  | R\breve*4

  %100
  \barNumberCheck #100
  | r1 b4 g2 g4 
  r4 b g2 r2 r4 g4 
  d'2 g,4 c c2 r4 c 
  c4 c c2 f, r2
  r1 r4 d'4 c8 b a g 
  f4 d r2 r2 a'2 
  d4 b c2 d r2
  r4 g4 g2 g r2
  r1 r2 e2 
  cis1 cis 
  R\breve*6

  %116
  \barNumberCheck #116
  | r1 r2 a2 
  a f4 g a2 d, 
  r2 g g g4 g 
  c2 d e g 
  f d r2 d 
  d1 r1 
  d1. d2 
  d\breve 
  R\breve*2
  
  %126
  \barNumberCheck #126
  | r2 c2 c4 c c f2 %tie44
   c4 c2 r4 f,4 f bes4 
  bes4 d2. d2 r2
  r4 d2 d4 d d g1 %tie
   c,2 r4 f4. e8 d c 
  b1 r2 d 
  b2 b4 b e,2 e 
  r2 b' e r4 e,2 %tie44
   e4 e e e2 e 
  r4 d g2. b2 g4 
  r4 d'2 g4 g1 
  r4 g,2 d'4 d2 b 
  b\breve
}

notesIIAlto = \relative c {
  R\breve*3
  r1 g''1. %tie1.
   g2 g g 
  d f f a2. %tie2.
   g4 f2. e2 c4 
  c4. b8 a1 c2 
  a2 d r4 a'2 a4 
  a2 a4 d,2 f e8 d 
  c2. b8 a g1 
  r1 d'2. b2 %tie44
   g4 d'4. c8 b1 
  | %14
  \barNumberCheck #14
  r4 d d a'2 f4 f2. %tie2.
   f4 d2 r2 c4 c
  g'2 d a' r2
  r2 a2 a d,2. %tie2.
   a4 a2 r2 a'2. %tie2.
   g8 f g2 c, r2 
  f a r2 d4 b4. %tie4.
   a8 g2 d4 d2 r4 a' 
  e g2 e4 a2 d, 
  r4 b d g2 d4 d2 
  R\breve*16

  %40
  \barNumberCheck #40
  | r2 b'2 b b 
  c1 r2 b4 g2. %tie42
    e2 r4 g g2. %tie2.
   c2 g4 r4 g,2 g4 
  g2 r4 g' b b2 b4 
  b\breve 
  | R\breve*19

  %65
  \barNumberCheck #65 
  | r1 g1 g1. g2 
  g2 g e c 
  f1 e 
  d r1
  r2 e2 e2. e4 
  e2 r2 r2 c'2 
  c g r4 c4. c8 c4 
  r4 c, c2 c c4. g8 
  g1 r2 g 
  d'4 b b d r4 g, c2 
  R\breve*5

  %81
  \barNumberCheck #81
  | r2 e2 f4. g8 a2 
  g4 g4. f8 d4 r4 a'2 e4. %tie4.
   f8 g4 r4 a c4. b8 a4. g8 
  f4. g8 a4 d, r1
  r2 a'2 a4. g8 \ficta fis2 
  g r2 d a'2
  r4 b4 g2. f8 e d2 
  R\breve*3

  %91
  \barNumberCheck #91
  r2 e4. e8 a4 c4. b8 a g 
  f4 d e2 r1
  r2 g4. f8 e4 c d2 
  r2 g4. f8 e4 c d2 
  r2 d a r2
  R\breve*4
  
  %100
  \barNumberCheck #100
  | r1 d4 g2 c,4 
  r2 e4 g2 d4 r4 g 
  d4 a' c2 f,4 a r4 e 
  a4 a e2 a r2
  r1 r2 a4 a4. %tie4.
   g8 f4 r4 e a d, r4 a' 
  g4. f8 e2 r2 c4 g2 %tie44
   g'4 c, g'2 c,4 r2
  r1 r2 a2. %tie2.
   cis2 a4 a1 
  R\breve*7
  
  %117
  \barNumberCheck #117
  | a'2 a a4 a d2. %tie2.
   c4 b a g c, g'2. %tie2.
   a4 \ficta bes2 g r4 d2 %tie44
   a2 d g,4 r4 d'2 %tie44
   a'4. d,8 d4 r1 
  g1. g2 
  g\breve 
  R\breve

  %125
  \barNumberCheck #125
  | r1 a2 a4 a 
  a4 c2 a4 a1 
  r1 d2. d,4 
  d2 r2 r2 d1 %tie
   f4 f4. g8 a4 bes g 
  r4 g2 c4. \ficta bes8 a g \ficta fis2 
  r4 d d2 r4 d d d 
  d4 g2 d4 r4 c g2. %tie2.
   g'4 g2 r1 
  g4 c4. g8 g4. e8 e c g'2 
  r2 g4 d'4. b8 b g g2 
  r4 d2 e8 f g2. b2 %tie44
   g4 b4. a8 g1 
  g\breve
}

notesIITenor = \relative c {
  R\breve*8
  r2 d'1 d2 
  d d a a 
  c e1 d2. %tie2.
   c4 a2 b4 g2 d'4 
  d2 b r2 g'2. %tie2.
   d2 a d c8 b 
  a2 d r2 g 
  e4 c f2 r2 e 
  a, f4 d a'2 d 
  r2 f2. f4 f2 
  r2 e4 c2 g d'2 %tie44
   d4 a2 d4. c8 b4. a8 
  g1 r2 d' 
  g,1 d'4. c8 a4. c8 
  | %23
  \barNumberCheck #23
  b\breve 
  R\breve*16 
  
  %40
  \barNumberCheck #40
  r2 d2 d b 
  e1 r2 d4 g, 
  g2 r4 e' e2. e,4
  e4. f8 g4 e r4 g d d'2 %tie44
   b4 r4 g g g'2 g4. %tie4.
   d8 g4 g2 r1
  R\breve*19
  
  %65
  \barNumberCheck #65
  | r1 g,1 
  c1. c2 
  c1 r2 c a 
  f c'2. c4 
  g1 r1
  r2 c2 c c 
  g r4 e'2 g g4 
  r4 e4. e8 e4 r2 r4 c4 
  a4 e r4 e'2 e4 e2 
  r4 d4. d8 d4 r2 d 
  d4. d8 d4 b r4 e,2 e'4 
  r4 a, a2 r1
  R\breve*4
  
  %81
  \barNumberCheck #81
  | r2 a2 d4. d8 d4 a 
  r4 d2 g4. f8 e d e4 c 
  r4 c d8 e f d e2 e,4 a4. %tie4.
   d,8 f4. g8 a4 r1
  r2 c2 d1. %tie1.
   g,2 r4 f a2
  r4 g4 d2 r1
  R\breve*3
  
  %91
  \barNumberCheck #91
  r2 a'2. a4 c2 
  d c r1
  r2 b2 c b 
  r2 b c4 c b2 
  e, r2 r1
  R\breve*4
  
  %100
  \barNumberCheck #100
  | r1 r4 b'4 g4. a8 
  b8 c d4 r4 g,8 a b c d4 e e 
  f d e2 r2 r4 c4 
  c4 f, c'2 a r2
  r1 r4 a4 c4. b8 
  a4 d r2 r2 r4 c4 
  g4 b g4. a8 b c d4 r4 g, 
  b4 g g2 r2 b4. a8 
  g8 e g4. f8 e4 r2 e'1 %tie
   e2 e\breve %tie11
    r1
  R\breve*5
  
  %116
  \barNumberCheck #116
  | r1 r2 a,2 
  |c d4 e f2. e4 
  |d2 g,2. a8 b c1 %tie
   g2. a4 b c 
  |d e fis2 g1 
  |fis r1 
  |d1. d2 
  |d1 r2 d 
  |d4 d d f2 f, c'2 %tie44
   a4 r4 c2 a4 a2 
  |r4 a2 a4. \ficta bes8 c4 f,2 
  r2 r4 f2 f4 f f 
  f2 r2 d bes'2 
  f4. g8 a2 r1 
  |c4 c4. d8 e c d2 r4 d2 %tie44
   b4 b g4 g2 g 
  |r1 r2 c2. %tie2.
   g2 d'4 r4 e2 c2 %tie44
   g4 g2 r2 g' 
  g4. g,8 b4. c8 d1 
  b r1 
  b\breve 
  b\breve
}

notesIIBaritone = \relative c {
  R\breve*7
  r1 r2 a'1 %tie
   a2 a a 
  d, f f a1 %tie
   g2 g2. d4 
  f2. e4 d\breve %tie11
    r2 d'2. %tie2.
   d4 d2 d4 a2 d2 %tie44
   a4 a2 r2 c1 %tie
   f,2 a r4 a2 %tie44
  f4 a2. d4 a d, 
  a'2 f4 d r4 d'2 d4 
  c a r4 c4. d8 e4 b d 
  r4 d,2 d d'4 d2 
  r4 d g, d' b2 r2
  r1 r4 a2 d2 %tie44
   d,4 r4 d2 g4 d g2 %tie44
   c,4 g' g f\breve %tie11
    r1
  R\breve*14
  
  %40
  \barNumberCheck #40 
  | r2 g2 g4 d'2 g,4 
  r4 g2 c,4 e4. f8 g2 
  r2 c1 c2 
  c2 r2 d1 
  b2 b4. c8 d2 r4 d,2 %tie44
   e8 f g2 d1 
  | R\breve*19
  
  %65
  \barNumberCheck #65
  r1 g1 
  e2 c c\breve %tie11
    r1 
  R\breve*2
  r2 c2 c4 c c2 
  r2 e4 e2 e4 g4. g8 
  g2 c4 c2 a c4. %tie4.
   c8 c4 r2 c,4 c2 c4 
  r2 g'8 g g4 r2 g 
  g4 g d d r4 g c, g' 
  r4 d f2 r1
  R\breve*4
  
  %81
  \barNumberCheck #81
  | r2 a4 a4. g8 f4. e8 d4 
  r4 d2 d4 a' c4. b8 a4 
  r4 e a d c a4. b8 c4 
  f, a d,2 r1
  r2 e4 a2 d,4 a'2 
  g g4 d'2 a4 d2 
  d1 r1
  R\breve*3
  
  %91
  \barNumberCheck #91
  r2 a2. a4 a2 
  d, a' r1
  r2 g2 c, g' 
  r2 g c, g'4 g2 %tie44
   e4 g2 r1
  R\breve*4
  
  %100
  \barNumberCheck #100
  | r1 r4 d4 e2 
  b2 r2 b' g4 e 
  a4 d, g2 r2 r4 g4 
  a4 a g e f2 c 
  r1 r4 d4 e2 
  f r2 r4 f4 c c 
  g'2 g r4 g2 e4 
  g2 r2 r4 g4. d8 d4 
  r4 g c, g' r2 a 
  e2 cis cis1 
  R\breve*6
  
  %116
  \barNumberCheck #116
  | r1 r2 a'2 
  a a4 a d2. c4 
  b a b2 c c,4 d 
  e4 c g'2 r2 d1. %tie21
  d\breve %tie11
    r1 
  d1. d2 
  d1 r2 d 
  d4 f f a2 d,4 a'2 
  r2 f c'1 
  f,2 r2 r4 c' c c 
  c f,4. g8 a4 r4 d,2 f2 %tie44
   d4 d2 r2 r4 d4 
  a'4 f f2 r2 g 
  g r2 r4 d'4. d,8 d2 %tie44
   d4 r2 r4 d'2 b4
  b4 g4 g2 g1 
  r1 g2 g 
  r4 c,2 c'4. g8 g4 r4 g2 %tie44
   b4 b b b4. c8 d2 
  r2 g,4 d'2 g,4 b4. c8 
  d\longa
}

notesIIBass = \relative c {
  R\breve*8
  r1 d1. %tie1.
   d2 d d 
  a c1 g2 
  d' d g,\breve. %tie1breve
  r2 d' f f4. g8 
  a2 d, r2 e 
  e a1 e2 
  f1. d2 
  r4 d2 a'4 d,2 r4 a'2 %tie44
   e4 e2. g4 g2 
  | r1 r2 g,2 
  g g2. g4 d'2 
  r1 r2 d1 %tie
   g,2 d'1 
  R\breve*16

  %40
  \barNumberCheck #40
  | r1 r2 g2 
  g g g4. a8 b2 
  g r2 r2 c,2 
  g' e r2 g 
  g,2 g' g2. f8 e 
  d1 r4 g,2 d'4 
  d2 r2 r1
  R\breve*22
  
  %69
  \barNumberCheck #69
  | r1 d2. g2 %tie44
   g4 e2 r4 g2 e2 %tie44
   c2 g' c,4 e2. %tie2.
   e4 g2 r2 c,4 c2 %tie44
   e4 a e e2 r4 g 
  g4. a8 b2 r2 b, 
  d4 d g2. g4 e2 
  d r2 r1
  R\breve*5
  
  | %82
  \barNumberCheck #82
  r2 g2 c,2. c4 
  e2 f4 a4. a8 e4 a2 
  a1 r1 
  r2 e2 f2. e4 
  d2 r4 d4. e8 f4. g8 a4 
  r4 d, g2 g r2
  R\breve*12
  
  %100
  \barNumberCheck #100
  r1 r4 g,4 c2 
  g r4 c g g c2 
  d r2 r1
  R\breve
  r1 r4 d4 a2 
  d r2 r4 d4 a a 
  b g c2 g c 
  d4 e c d e4. c8 g'2 
  e1 r2 a1 %tie
   e2 a\breve %tie11
    r1
  R\breve*6
  
  %117
  \barNumberCheck #117
  | r2 d,2 d d4 d 
  g2. f4 e2. d4 
  c2 b c g 
  d'2. c4 b4. a8 g2 
  d'1 r1 
  g,1. g2 
  g\breve 
  r2 d'1 f2 
  f4 f a2 f a2. %tie2.
   a,4 a2 r2 a 
  c2 c bes d 
  r4 d2 g f8 e d2 
  r2 r4 f2. d2 
  r4 g2 e4 f4. d8 a'2 
  r4 d, d2 r2 g, 
  d' d4 d c2 c 
  g' g4. f8 e2 c 
  e1 c 
  r2 d g b1 %tie
   g2 b b4. a8 
  g\breve
  g\breve
}

% ------------
% Choir 3
% ------------

notesIIISoprano = \relative c {
  R\breve*10
  r1 r2 d''1 %tie
   d2 d d 
  g, b b d2. %tie2.
   d4 a2 r2 d 
  d2 d2. c4 c2 
  r2 f, c'4. b8 a4. g8 
  f2 f'1 f2 
  f f4. e8 d2 d2. %tie2.
   c4 c2. b8 a b4 g 
  a1 b2. g4 
  b4. c8 d2 d4. e8 f2 
  g e f d 
  d1. b2 
  e, g r4 c, f2. %tie2.
   f4 f2 r1
  R\breve*9
  
  %35
  \barNumberCheck #35
  r1 r2 c'2 
  c2 c a4 d2 a4 
  r4 c4. d8 e4 f4. e8 d4 c 
  b1 r1
  R\breve
  
  %40
  \barNumberCheck #40
  | r1 r2 g2 
  g2. c4 c2 r2 
  c2 e e2. e4 
  e1 r2 b 
  b2. d2 b4 b2. %tie2.
   g4 d'2 b1 
  R\breve*16
  
  %62
  \barNumberCheck #62
  | r1 r2 g'1 %tie
   d2 f e 
  d1 r2 d 
  d\breve
  R\breve*3

  %69
  \barNumberCheck #69
  | r1 d1 
  g,2. g4 g2 g' 
  e c g'2. g4 
  c,1 r2 a4 a2 % tie44
  a4 a2 e4 e'4. g8 g4 
  r4 g4 g2 r2 d 
  
  %75
  \barNumberCheck #75
  | g,4 g g2 
  g4 c2 c4 
  R\breve*8
  
  %84
  \barNumberCheck #84
  | r2 d2 b1 
  c r1 
  b4 g2 f8 e d2 r2 
  g4 b4. c8 d4 r1
  r2 d2. d4 d2 
  g, d' r1
  r2 e2. e4 e2 
  a, e' r1
  R\breve*4
  
  %96
  \barNumberCheck #96
  | r2 e2 a, e' 
  r2 e4 a,2 a4 c e 
  r4 a,2 e'4 r4 a,8 b c d e4 
  r4 a, a2 r1
  R\breve*4
  
  %104
  \barNumberCheck #104
  r4 f'4 e2 d r2
  r4 f4 e e d2 c 
  r4 b e2 d c 
  b4 e2 d c b4 
  c1 r2 cis 
  a2 e' e\breve %tie11
    r1
  R\breve*2
  
  %113
  \barNumberCheck #113
  | r1 r2 e2 
  e e4 e g2. f4 
  e2. d4 c2 c 
  d e4 e f2. e8 d 
  c4 a2 d c4 a2 
  b1 r1
  R\breve*3
  
  %122
  \barNumberCheck #122
  | d1. g2 
  g\breve
  R\breve*2
  r1 r2 c,2 
  |c4 c c f2 d4 f2. %tie2.
   bes,4 bes2 r2 d2. %tie2.
   d,2 a'4 a2 r4 \ficta bes4. %tie4.
  a16 \ficta bes a8 g g2 r2 r4 a4 
  | d2 r2 g, b 
  |b4 b d2 r4 g, g2 
  |r2 g g1 
  |r1 r2 g'2 
  |g4 g g g2 f8 e d1 %tie22
  g,2 d'1 
  d\longa
}

notesIIIAlto = \relative c {
  R\breve*11

  %12
  \barNumberCheck #12
  | r1 r2 g''1 %tie
   g2 g g 
  d f f a2. %tie2.
   g4 f2. e4 e4. d8 
  c4. b8 a2 e' a,1 %tie
  d2 r2 d2 
  | a4 a' a4. g8 f4 d2 a'2 %tie44
  c2 g4 g2 g 
  f4. e8 d2. b4 d4. c8 
  b4. a8 g2 r2 a4 a 
  e'2. e4 a,2 d2. %tie2.
   g,2 b4 g g'2 d4 
  r4 g e c2 a4 a2. %tie2.
   c2 a4 d2 r2
  R\breve*9
  
  %35
  \barNumberCheck #35
  | r1 r2 e2 
  e c f a2. %tie2.
   g4 g1 \ficta fis2 
  g1 r1
  R\breve
  
  %40
  \barNumberCheck #40
  | r2 g2 g4 d d2 
  r4 e4. f8 g4 g2 r2
  r4 c,2 c'4 c2 r4 c,4
  c4 e4. d8 c4 r4 g' g2 
  d g, r2 d'1 %tie
   d2 g1 
  R\breve*16

  %62
  \barNumberCheck #62
  | r2 c1 g2 
  b b a r4 a2 %tie44
   d4. c8 b4 a d4. c8 a4 
  b\breve
  R\breve*3
  
  %69
  \barNumberCheck #69
  | r1 g2. g4. %tie4.
   c,8 e c c4 g g2 r2 
  e'4 e2 e4 r2 c2. %tie2.
   c4 c2 r1
  r2 c'4 c2 g4 c4. c8 
  b1 r2 r4 g4 
  g4 d d d r4 e g2 
  R\breve*8
  
  %84
  \barNumberCheck #84
  | r2 a2 d,2 g2. %tie2.
   c,4 c2 r1 
  g4 b4. c8 d4 d2 r2 
  g,4 d'2 b4 b1 
  r2 d2. d4 g2 
  g2 g r1
  r2 e2. e4 a,2 
  r4 a2 e'4 e2 r2
  R\breve*4
  
  %96
  \barNumberCheck #96
  | r2 e4 a4. d,8 a'2 e4 
  r2 r4 a,2 d4 r4 c 
  f4. g8 a2 r4 f c'2 
  f, r2 r1
  R\breve*4
  
  %104
  \barNumberCheck #104
  | f4 a4. g8 e4 a2 r2
  r4 a4 a a a2 a 
  r2 r4 e4 g2 g 
  r2 r4 g4 e c' b g 
  g2 r2 r2 e1 %tie
   e2 e\breve %tie11
    r1 
  R\breve*3
  
  %114
  \barNumberCheck #114
  | r2a2. g4 a b 
  c2 b a1 
  r2 e a a4 a 
  a2 a2. e4 \ficta fis2 
  g1 r1
  R\breve*3
  
  %122
  \barNumberCheck #122
  | b1. b2 
  b r4 b,2 d4 d2 
  R\breve*2
  
  %126
  \barNumberCheck #126
  | r1 f2 f4 f 
  f4 a2. d,1 
  r2 g g1 
  r2 d' d1 
  r1 d1 
  r4 g,2 g4 g g g2 
  g r2 r4 g2 e4 
  g4 c, r4 g'4. e8 e4. f8 g4 
  r2 r4 c,4 e g2 g4 
  r4 d2 g4 g2 g 
  r2 r4 d4. b8 b2 g4 
  r4 d' b d d\breve.
}

notesIIITenor = \relative c {
  R\breve*11

  %12
  \barNumberCheck #12
  | r2 d'1 d2 
  d d g, b 
  b d2. d4 a2 
  r2 a c e1 %tie22
  d1 \ficta cis2 
  d4 d2 c8 b a2 f 
  r2 a4 a d2. d,4 
  a'2 e4 g c2 b 
  a1 g 
  r4 g2 b4. c8 d4 r4 d 
  e2 g f4 d4. c8 a4 
  d2. d4 b1 
  r4 g g c2 f,4 a c2 %tie44
   a4 a2 r1
  R\breve*9
  
  %35
  \barNumberCheck #35
  r1 r2 e'2 
  e e a,1 
  e'1 a,2 d2. %tie2.
   g,4 d'2 r1
  R\breve
  
  %40
  \barNumberCheck #40
  r2 d2 d4 d d2 
  r2 c c4 g2 d'4 
  r4 e2 c g4 g2 
  r2 g' g4. g,8 b4. c8 
  d2. d4 b\breve. %tie1breve
  R\breve*12
  
  %58
  \barNumberCheck #58
  | r2 g'1 c,2 
  e2 e d4. c8 b4 g 
  a4. b8 c4 g2 d'4 b d 
  r4 d2 cis4 d2. d4 
  d2 c1. 
  b2 d2. a4 c2 
  f4. e8 d2. c8 b a2 
  d\breve 
  R\breve*4
  
  %70
  \barNumberCheck #70
  | g,2. c4 c g2 c4 
  c g g2. g4 c2 
  r4 e, e e r4 c'2 c4 
  c2 r2 r2 g2. %tie2.
   g4 g2 r2 g4 d' 
  d4 d4. g,8 g4 r4 c e2 
  R\breve*8
  
  %84
  \barNumberCheck #84
  | r2 f2 g2. f4 
  e1 r1 
  d4 g,4. a8 \ficta bes4 f a r4 d4. %tie4.
   b8 d4 g,2 r1
  r2 d'2. d4 b2
  | r4 g2 d'4 d2 r2 
  | r2 e2. e4 e2 
  d2 c r1
  R\breve*4
  
  %96
  \barNumberCheck #96
  | r2 c2 a4. b8 c4 a 
  r2 a a4 f c'4. b8 
  a2 a r4 a2 c4 
  a2 r2 r1
  R\breve*4
  
  %104
  \barNumberCheck #104
  | a4 d2 c4 d2 r2
  r4 d4 e e f d e2 
  r2 c4 g4. a8 b4 c2 
  r4 g4. a8 b4 c g'4. f8 d4 
  e1 r2 e 
  a,2. cis4 cis1
  R\breve*4

  %114
  \barNumberCheck #114
  | r1 r2 g2. %tie2.
   a4 b b c2. b4 
  a f g2 a f4 a4. %tie4.
   b8 c4 f,2. g4 a2 
  r2 d g,1 
  R\breve*3
  
  %122
  \barNumberCheck #122
  | d'2. g2 d g,2 %tie44
   g'2 d b4 d2 
  | r2 d d c4 c 
  c2. a4 a2 r2
  r4 c2 f, c'4. \ficta bes8 a4 
  r4 f'4. c8 c4 r2 bes 
  f r2 g d' 
  r4 d2. a4 f'4. e8 d4 
  r1 r4 d4 d2 
  r2 b b r2
  r4 g'2 g4 g g g2 
  | c, r2 r4 c2 e4 
  g c, c1 g2 
  r4 b d2 r2 d,2. %tie2.
   g4 d2 r4 d' d2. %tie2.
   g,2 b g4 r4 g 
  | g\breve
}

notesIIIBaritone = \relative c {
  R\breve*12

  %13
  \barNumberCheck #13
  | g'1. g2 
  g f d f 
  f a1 g1 %tie
   f2 e1 
  d1 r2 d2. %tie2.
   f4 f4. g8 a4 d, f2 
  c2. e2 c4 d4. e8 
  f2 f4. e8 d\breve %tie11
    r2 d4 d 
  g2 c, f f4. e8 
  d\breve
  d\breve
  R\breve*10
  
  %35
  \barNumberCheck #35
  | r1 r2 e2 
  e2 e d1 
  e2 c f2. e4 
  d1 r1
  R\breve
  
  %40
  \barNumberCheck #40
  | r2 g2 g4. f8 d2 
  r1 r2 d4 g2 %tie44
   e2 e4 e4. f8 g2 
  r4 c c2 r4 b2 g4 
  g2 r4 g2 d'4. g,8 b4. %tie4.
   c8 d4 d, g2. b4 g 
  a4. b8 c2 r1
  R\breve*10
  
  %57
  \barNumberCheck #57
  | r1 r2 r4 c2 %tie44
   g2 b4. a8 g2 f4 
  g4 e g2 r2 d'1 %tie
   g,2 b b 
  a g4 e f d2 f4 
  a f c' c,2 e4 g c, 
  r4 g'4. a8 b g a2. e4 
  a2 r4 d, f2 f4. e8 
  d\breve
  R\breve*4
  
  %70
  \barNumberCheck #70
  c2 g'2. c4 c2 
  r2 c c2. g4 
  c4 g g2 r2 f 
  c'4 c,4. d8 e4. f8 g4. c,8 c'4 
  r4 d4 d2 r2 g,4 g2 %tie44
   g4 g g r2 g 
  d8 e f g a4 f c'2 r2
  R\breve*7
  
  %84
  \barNumberCheck #84
  | r2 d2 d g, 
  g r2 r1
  r2 d2. d4. e8 f d 
  | g1 r1
  r2 d4. d8 g4 b4. a8 g f 
  e2 b' r1
  r2 e,4. e8 a4 c4. b8 a g 
  f4 d e2 r1
  R\breve*4
  
  %96
  \barNumberCheck #96
  | r2 c2 f c 
  r2 c' a a4. g8 
  f2 c r4 d e2 
  f r2 r1
  R\breve*4
  
  %104
  \barNumberCheck #104
  | r4 d4 a'2 d, r2
  r4 d4 a' a d,2 a' 
  r1 r2 g2 
  | g g g1 
  g2 r2 r2 a1 %tie
  a2 a\breve %tie11
    r1 
  R\breve*11
  
  %122
  \barNumberCheck #122
  | g1. g2 
  g\breve 
  r1 r4 a2 a4 
  | a4 f c'2 a4 c2 f,4 
  a2 r4 a f a a2 
  r2 r4 a4. g8 f d d'2. %tie2.
   bes4 bes2 r2 g 
  d2 a' a r2
  r4 c2. f,2 r4 d'2. %tie42
    g,4 b r2 b2. %tie2.
  b4 b g2 c c,4. %tie4.
  d8 e4 r2 e4 g2 c,2 %tie44
   c'2 g4 g1 
  r2 d d1 
  r1 d 
  d\longa
}

notesIIIBass = \relative c {
  R\breve*13

  %14
  \barNumberCheck #14
  | r2 d1 d2 
  d d a c1 %tie22
  d2 a a 
  d1 f1. %tie1.
   d2 f1 
  e1 c2 g' 
  r2 d1 d2 
  g d d1 
  r1 r2 d2 
  d g1 g4. f8 
  e1 r2 c4 c 
  c1 r1
  R\breve*9
  
  %35
  \barNumberCheck #35
  | r1 r2 e2 
  a, a' a f 
  g1 a2. a4 
  g1 r1
  R\breve
  
  %40
  \barNumberCheck #40
  | r2 g,2 g d'4. f8 
  e4. d8 c2 c b 
  c g'1 c,1 %tie
  c2 d b 
  r4 d2 g,4 g\breve. %tie1breve
  R\breve*11
  
  %57
  \barNumberCheck #57
  | r1 r2 c1 %tie
   g2 b a 
  c1 g 
  r2 g'1 d2 
  f e d f1 %tie
  c2 e e 
  d2 d1 e2 
  f4 f g2 a1 
  g\breve
  R\breve*3
  
  %69
  \barNumberCheck #69
  | r1 g1 
  g2 g e1 
  r2 c c c 
  c2. c4 c2 r4 a2 %tie44
   e'4 e a2 g4 e4. f8 
  g4 g, g2 r2 d' 
  d2. d4 c2 c 
  f2 f r1
  R\breve*7
  
  %84
  \barNumberCheck #84
  | r2 d2 g1 
  c,2 r2 r1 
  r2 g'2 a1 
  b1 r1
  r2 g2. g4 g2 
  g2 g r1
  r2 a2. a4 e2 a a r1
  R\breve*4
  
  %96
  \barNumberCheck #96
  | r2 a,2 d a 
  r2 a d a 
  d a r4 d a'2 
  d, r2 r1
  R\breve*8
  
  %108
  \barNumberCheck #108
  | r1 r2 a2 
  cis2 e1 \ficta c4 a 
  e'2 a, r1
  R\breve*11

  %122
  \barNumberCheck #122
  | d1. d2 
  d\breve 
  r2 f f f4 f 
  a2 f r4 c2 a4 
  c2 r2 c c 
  c4 c f1 bes,2 
  d1 g, 
  r4 d'2 d4 f f bes2
  g1 a 
  g1 r2 g 
  g2 g4 g g1 
  e4 c g'1 c,2 
  c\breve 
  g\longa~
  g\longa
}

% ------------
% Choir 4
% ------------

notesIVSoprano = \relative c {
  R\breve*18
  r1 r2 d''1 %tie
   d2 d d 
  g, b1 a2. %tie2.
   g4 g1 fis2 
  g1 r2 g2
  g4 c4. d8 e4 f2. f,4
  f4 c'2. f,4 bes4. a8 g4 
  r4 e a c bes4. a8 g4 d 
  e2. f4 g1 
  R\breve*7
  
  %35
  \barNumberCheck #35
  | r1 r2 e'2 
  e2 e f1 
  e2. c4 d2 d 
  d1 r1
  R\breve
  
  %40
  \barNumberCheck #40
  | r2 b2 b4. c8 d2 
  r4 g, g2 r2 g 
  g4 g4. g8 g4 r1
  r2 g'2 g g2. %tie2.
   f8 e d2 d g, 
  d'\breve
  R\breve*13
  
  %59
  \barNumberCheck #59
  | r2 g1 d2 
  f e d d 
  a c b4 a8 g f4 d 
  r4 a'2 f4 g2 e4. f8 
  g8 a b4 g d' d2 r2 
  a b4. c8 d e f4. e8 d4. %tie4.
   c8 b4 g d'2 b4 b2 
  R\breve*3
  
  %69
  \barNumberCheck #69
  | r1 b1 
  e,2. e4 e2 r4 e' 
  e2 e4 e2 e4 e2 
  r2 c4 c2 c4 c2. %tie2.
   c4 c2 r1 
  d4. d8 d2 r2 d 
  g2. g4 g2 g 
  f4 d d2 r1
  R\breve*7
  
  %84
  \barNumberCheck #84
  | r2 f2 d1 
  e r1
  r2 r4 d4 d2 a4 d 
  d1 r1
  | r2 b2. b4 b2 
  | g4 e g2 r1
  | r2 c2. c4 c2 a4 f c'2 r1
  R\breve*4
  
  %96
  \barNumberCheck #96
  | r2 c2 d c 
  r2 c d4 a2 c4 
  f,2 r4 c' f d2 cis4 
  d2 r2 r1
  R\breve*4
  
  %104
  \barNumberCheck #104
  | r4 d4 c8 b a g f4 a a2 
  r4 f a a f4. g8 a2 
  r2 r4 g4 g2 g 
  r2 r4 d'4 g, c d g2 %tie44
  e4 e2 r2 \ficta cis1 %tie22 
  \ficta cis2 \ficta cis4. d8 e2 
  R\breve*4
  
  %114
  \barNumberCheck #114
  | r1 r2 e,2 
  e g4 g a2 e 
  r1 r4 a4 d2 
  e4 e f2. e4 d2. %tie2.
   g,4 d'2 c1 
  R\breve*3
  
  %122
  \barNumberCheck #122
  | d1. d2 
  d\breve 
  R\breve*3
  
  %127
  \barNumberCheck #127
  | r1 r2 d2 
  d d4 d g2. d2 %tie44
   c8 \ficta bes a4 d,4. e8 f4 r2
  r4 e2 g4 d \ficta fis4. g8 a4 
  r4 b b2 r1
  r2 g2 g4 g g c 
  c2 r2 c e2
  e4 e e1 e2 
  r2 b b2. d2 %tie44
   b4 b2. g4 d'2 
  r2 d g1
  g\breve
}

notesIVAlto = \relative c {
  R\breve*15

  %16
  \barNumberCheck #16
  | r2 a''1 a2 
  a2 a d, f 
  f2 a a4. g8 f4 d 
  e2 c r2 g'4 g 
  g2 \ficta fis g1 
  r1 r2 d'2 
  b c a1 
  b2 b b b 
  c c4. \ficta bes8 a4 f c'2 
  f, a4 a d,1 
  r2 a4 a d2 g,4 g'2 %tie44
   g4 c,2. d4 e2 
  a,1 r1
  R\breve*6
  
  %35
  \barNumberCheck #35
  | r1 r2 a'2 
  a2 a2. f2 d4 
  g2 e a r4 d,2 %tie44
   b4 g g'2 e4 e2 
  R\breve
  
  %40
  \barNumberCheck #40
  | r2 g2 g g 
  c,4 e r4 e e2 r4 g 
  c,4 g' g2 r2 g 
  c, r2. g'4. b8 b4. %tie4.
   g8 g4 r4 d d2 r4 b 
  g2 r4 g'2 d d4. %tie4.
   c8 a4 e'2 r1
  R\breve*11
  
  %58
  \barNumberCheck #58
  | r1 r2 c'1 %tie
   g2 b b 
  a r4 g2 b4. a8 g2 %tie44
   fis4 g2 r2 r4 d2 %tie44
   a2 c4 c g2 g'2 %tie44
  g4 g4. f8 d4 f a c4. %tie4.
   b8 a4. g8 g2 \ficta fis8 e \ficta fis2 
  g\breve 
  R\breve*3
  
  %69
  \barNumberCheck #69
  | r1 r2 g2 
  g2. c,4 c2 r2
  r4 g'4 c2 c4 c4. c8 c4 
  r2 r4 c,4 c2 c 
  r4 c4. a8 a4 r1 
  d4. g8 g2 r2 g4 g 
  g4 b4. g8 g2 g4 r2
  R\breve*8
  
  %84
  \barNumberCheck #84
  | r2 a2 g4. f8 d2 
  g2 r2 r1
  r2 g4 d4. a'8 a4. d,8 d4 
  r4 g2 d4 d2 r2
  r2 g2. g4 g2 
  c b r1
  r2 a2. a4 a2 
  a2 a r1
  R\breve*4
  
  %96
  \barNumberCheck #96
  | r2 a2 a a 
  r2 a a a 
  a a r4 a a2 
  a r2 r1
  R\breve*4
  
  %104
  \barNumberCheck #104
  | r4 d,4 e2 f4 d r2
  r4 a'2 c4 d a2 c4 
  r2 c,4 g'4. d8 g4 e g 
  r4 g g2 g r2
  r1 r2 a1 %tie
   a2 a\breve %tie11
    r1
  R\breve*4
  
  %115
  \barNumberCheck #115
  | r2 e2 e e4 4 
  a2. g4 f4. e8 d4 a 
  a2 a' d, a' 
  d,1 r1
  R\breve*3 
  d1. d2 
  d\breve
  R\breve*3
  
  %127
  \barNumberCheck #127
  | r2 f2 f f4 f 
  bes1. g2 
  a1 r2 g2. %tie2.
   e4. d8 c4 r4 a d2 
  r4 d4. g8 g4 r2 r4 b2 %tie44
   b4 b b c2 c 
  r2 b4 g2. e2 
  r4 g g g g c2 g4 
  r4 g,2. g2 r4 g' 
  b1 r2 b 
  b\longa
}

notesIVTenor = \relative c {
  R\breve*16

  %17
  \barNumberCheck #17
  | r2 d'1 d2 
  d2 d a a 
  c e1 d2 
  d2. c4 b1 
  b2. g4 b4. c8 d1 %tie
   cis2 d1 
  r2 d g,4 b4. c8 d4 
  r2 e a,4 c c2 
  r4 f, c'2 bes4 d2 g,4 
  r4 c2 f,4 bes g d'2 
  r4 g, g2 r1
  R\breve*7
  
  %35
  \barNumberCheck #35
  | r1 r2 c2 
  c c d d 
  g, g' f4 d4. c8 a4 
  d1 r1
  R\breve
  
  %40
  \barNumberCheck #40
  | r2 d2 d4 d d2 
  r2 e e r2 
  e g2 g r2 
  g, c b4 g d'2 
  r2 d1 d2 
  d\breve
  R\breve*11
  
  %57
  \barNumberCheck #57
  | f1 c2 e2. %tie2.
   d4 b2 d f 
  e4 c2. b2 g 
  f4 d e4. f8 g1 
  r2 g'1 d2 
  f f e2. c4 
  d2 b d r4 a 
  d4. c8 b4 g' f d r4 d 
  b g d'2 d1 
  R\breve*4
  
  %70
  \barNumberCheck #70
  | c2 c c4. d8 e2 
  r4 e, g2 g4 g4. g8 g4 
  r2 r4 e'4. d8 c4. b8 a4 
  r4 e'4. c8 c2 g'4. e8 e4 
  b4 d4. d8 g,4 r2 r4 d4 
  d4. d8 d4. g8 g4 g r2
  R\breve*8
  
  | r2 a4 d2 g,4 d'2 
  c1 r1
  r2 d4 d4. c8 d e f4 d 
  d1 r1
  r2 b2. b4 d2 
  e d r1
  r2 c2. d4 e2 
  f2 e r1
  R\breve*4
  
  %96
  \barNumberCheck #96
  | r2 e2 f e 
  r2 e f e 
  d c r4 f e2 
  d2 r2 r1
  R\breve*4

  %104
  \barNumberCheck #104 
  | r4 a4. b8 c4 f,2 r2
  r4 f4 c' c f,2 c' 
  R\breve*2
  
  %108
  \barNumberCheck #108
  | r1 r2 e1 %tie
   e2 e\breve %tie11
    r1
  R\breve*3
  
  %114
  \barNumberCheck #114
  r2 e2 e e4 e 
  g2. f4 e a,8 b c d e4. %tie4.
   d8 d4. b8 c4 d2 f 
  e d d1 
  R\breve*4
  
  %122
  \barNumberCheck #122
  | b1. b2 
  b r4 b2 b4 b g 
  d'2. c8 b a2 r2 
  f4 c'2 f,4 r4 f c'2. %tie2.
   d8 e f2 r4 f2 c4 
  r4 c c2 r1 
  d2 d d4 d g2 
  f r4 d2. d2 
  r1 d, 
  d2 r4 d' d d d g, 
  g2 r2 r2 e2 
  e2 r2 g g 
  r2 e e'4 e2 e4 
  b4 d g, b b1 
  r2 r4 d,4 g b g d'2 %tie44
  b4 d2 d\breve.
}

notesIVBaritone = \relative c {
  R\breve*15

  %16
  \barNumberCheck #16
  | r1 a'1. %tie1.
   a2 a a 
  d,2 f f a1 %tie22
  g2 g1 
  r2 d'1 d2 
  d2 d g, a 
  b g a a 
  g1 r2 g1 %tie
   c,2 f2. a2 %tie44
   f4 f2 r1
  R\breve*9
  
  %35
  \barNumberCheck #35
  | r1 r2 a2 
  a a f1 
  c'2 c f,4. g8 a2 
  b1 r1
  R\breve
  
  %40
  \barNumberCheck #40
  | r2 b2. g4 g2 
  g1 r1 
  g2 g r4 c,2 c'4. %tie4.
   g8 g4 r4 g2 b2. 
  b4. c8 d2 r4 g,2 d'2 %tie44
   g,4 b4. c8 d2 g, 
  R\breve*10
  | r1 r2 bes1 %tie22
  f2 a g 
  g1 r2 r4 c,4. %tie4.
   d8 e4 c g'2 d4 d2 
  r1 r2 d'1 %tie
   g,2 b b 
  a1 g2 g2. %tie2.
   d4 g2 f4 d a'2. %tie2.
   d,4 d2 r4 a' d1 %tie
   b2 b1 
  R\breve*4
  
  %70
  \barNumberCheck #70
  | c2 g2. g4 g2 
  r4 c,4. e8 e4. c8 c'4 r4 c,2 %tie44
   g'4 g c4. c8 c4 r2
  r4 c,2. g'4 c, r2
  r4 b4. b8 b4 r2 r4 b'4 
  g4 g d'4. g,8 g4 g r2
  R\breve*8
  
  %84
  \barNumberCheck #84
  | r2 a2 b2. a4 
  g2 r2 r1 
  r2 d'2 a d, 
  r4 d d2 r1
  r2 d2. d4 d2 
  c d r1
  r2 e2. e4 c2 
  f c r1
  R\breve*4
  
  %96
  \barNumberCheck #96
  | r2 e2 d e 
  r2 c f4 d a'2 
  d,2 e r4 f c a' 
  a2 r2 r1
  R\breve*4
  
  %104
  \barNumberCheck #104
  | r4 a4 a2 a r2
  r4 a4 a a a2 a 
  R\breve*2
  
  %108
  \barNumberCheck #108
  | r1 r2 e1 %tie
   e2 e\breve %tie11
    r1
  R\breve*3
  
  %114
  \barNumberCheck #114
  | r1 r2 e2 
  e2 e4 e a2. g4 
  f2 e d1 
  a'2 d, a'1 
  R\breve*4
  
  %122
  \barNumberCheck #122
  | d,1. d'2 
  b g2. d4 g2 
  r2 a a4 a a c2 %tie44
  f,2 c2. c2 
  r4 f2 c' f,4 f2 
  r4 f4. e8 c4 r4 f2 d4 
  d1 r2 d 
  f1. r2 
  e2 c r4 a'4. g8 \ficta fis4 
  r4 d'4. c8 b4 r4 g g g4. %tie48
  a8 b2 b4 r4 g c, g'2 %tie44
  c4 r2 c2. g4 
  g1 r2 g 
  g1 r2 g 
  g4. a8 b4. c8 d2. b4 
  b\longa
}

notesIVBass = \relative c {
  R\breve*16

  %17
  \barNumberCheck #17
  | r1 d1. %tie1.
   d2 d d 
  a2 c1 g2 
  d' d g,1 
  r2 g'1 f2 
  e1 d 
  g,1 g2 g 
  c2. c4 f,\breve %tie11
    r1
  R\breve*9
  
  %35
  \barNumberCheck #35
  | r1 r2 a2 
  a2 a d1 
  c2 e d2. d4 
  g,1 r1
  R\breve
  
  %40
  \barNumberCheck #40 
  | r2 g'2 g r4 g2 %tie44
   e4 g2 g1 
  r2 c, c e1 %tie
   c2 g'1
  g2. f8 e d1 
  d\breve 
  R\breve*11
  
  %57
  \barNumberCheck #57
  | r2 f1 c2 
  e4 e d1 a'2. %tie2.
   g4 e2 g r4 g, 
  d'2 c b4 g2. 
  d'2 r2 r2 d1 %tie
   a2 c c 
  g1 d'2 c 
  d2 g,2 d'1 
  g,\breve
  R\breve*3
  
  %69
  \barNumberCheck #69
  | r1 d'1 
  c2. c4 c2 r4 g' 
  g2 c, e2. e4 
  e2 r2 r4 a,2 a'2 %tie44
   a4 e c2 c4 e c 
  r4 g' g2 r2 g, 
  g4 g b b e2 c 
  R\breve*10
  
  %86
  \barNumberCheck #86
  | r2 g2 d'1 
  g,\breve 
  r2 g2. g4 b2 
  c2 g r1
  r2 a2. a4 c2 
  d2 a r1
  R\breve*4

  %96
  \barNumberCheck #96
  | r2 a'2 a a 
  r2 a d, r4 e 
  f a4. g8 e4 r4 d a2 
  d2 r2 r1
  R\breve*8
  
  %108
  \barNumberCheck #108
  | r1 r2 a1 %tie
   a4. b8 cis4 a \ficta c2 
  a1 r1
  R\breve*11
  
  %122
  \barNumberCheck #122
  | g1. b2 
  d g, g1 
  r1 r2 c2 
  c2 c4 c f1 
  c1 r2 c a c r2 f 
  f g4 a bes2 bes 
  a1 d, 
  r1 r2 d2. %tie2.
   g,4 d'2 r2 d4 d
  d2 g,4 g'2 c,4 e2 
  e4 g2 d4 r4 g2 e4. %tie4.
   f8 g2 c, g'4 g2 
  r4 g2 d g,4 d'1 %tie
   g2 g1~
  g\longa
}

% ------------
% Choir 5
% ------------

notesVSoprano = \relative c {
  R\breve*22

  %23
  \barNumberCheck #23
  | r2 d''2 d d 
  e1 c 
  c2 f2. e4 d2. %tie2.
   c4 c1 b2 
  c2. d4 e1 
  f2 c d2. c8 \ficta bes 
  a4 d, a'2 r2 d1 %tie
   g,2. a8 b c2 
  r2 e e e 
  g1 f2 d 
  e2. e4 e\breve %tie11
    r1
  R\breve*5
  
  %40
  \barNumberCheck #40
  | r2 d2. g,4 b2 
  g2 g' g g 
  g1 r2 g, 
  c4. d8 e2 r2 d4 b2 %tie44
  g2 b4. a8 g4 r4 d'2 %tie44
   b4 b2 r4 b2 d4 
  d2 r2 r1
  R\breve*8
  
  %55
  \barNumberCheck #55
  | r1 r2 f1 %tie
   c2 e d2. %tie24
  d4 c2 r4 c2 g2 %tie44
   c4 d2. g,4 c a 
  | r4 e'2 c4 d g,2 d'4 
  | d2 r2 r1
  R\breve*8
  
  %69
  \barNumberCheck #69
  | r1 b1 
  e1. e2 
  e1 r1 
  g2 e c f2. %tie2.
   e4 e2 r4 c g'2 
  g1 r2 g4 d2 %tie44
  d4 b2 e,4 g2 e4 
  r4 a d,2 r1
  R\breve
  
  %78
  \barNumberCheck #78
  | d'1 e2 e 
  f f g1 
  f2 e e1 
  e r1
  R\breve*4
  
  %86
  \barNumberCheck #86
  | r4 g,4 g2 r2 d 
  d r4 d'2 d4 b2 
  g4. a8 b2 r1
  R\breve*6
  
  %95
  \barNumberCheck #95
  | r1 r2 e2 
  f e r2 e 
  f e d c 
  r4 f e2 d r2
  R\breve
  r4 d4 c2 b r4 e 
  d4 d c2 b r2
  R\breve*6
  
  %108
  \barNumberCheck #108
  | r1 r2 e1 %tie
   e2 e\breve %tie11
    r1
  r1 r2 e2 
  e2 e4 e g2. f4 
  e2. d4 c2 b 
  a2 e' e1 
  R\breve*7
  
  %122
  \barNumberCheck #122
  | d1. d2. e8 f g2 g1 
  R\breve*2
  
  %126
  \barNumberCheck #126
  | r2 c,2 c c4 c 
  f1. d2 
  r4 d g, d'4. c8 bes4 r4 g 
  d'4 a2 d4 r4 d2 d4 
  e4 e g2. fis4 fis2 
  g1 r2 d 
  d2 d4 d e1. %tie1.
   d2. c4 c1. %tie21
  g2 r4 g2 %tie44
   f8 e d1. 
  r2 d'2 d1~
  d\longa
}

notesVAlto = \relative c {
  R\breve*22
  r1 r2 g''2 
  g g a\breve %tie11
    f2 g 
  a2. a4 g1. %tie1.
   e2. f4 g2 
  c,2 f2. g4 a2 
  d,2 f d4 g2 g2 %tie44
   d4 d2 r1 
  e2 a a c1 %tie22
  b2. a4 a1 %tie
   gis2 a1 
  R\breve*6
  
  %40
  \barNumberCheck #40
  | r2 d,2 d4 d d2 
  r2 r4 g2 g4 g2. %tie2.
   c,4 c2 r4 g'4. e8 e4. %tie4.
   c8 c2 e4 g2 r2
  r2 r4 g,4 g2 g'4 d 
  r4 g d2 d2. g4 
  f d g2 r1
  R\breve*7
  
  %54
  \barNumberCheck #54
  | r1 r2 c1 %tie
   g2 b4 b a2 
  r4 a a c4. c8 g2 bes2 %tie44
  f4 a2. f4 g2 
  g1 r2 a 
  e4 g2 c,4 g'1 
  R\breve*9
  
  %69
  \barNumberCheck #69
  | r2 d2 g2. g4 
  g1 r2 g4 g2 %tie44
  c,2 e e4 e2 
  r2 c' c a 
  c r4 c,4. e8 e4. c8 c4 
  r4 b4. c8 d4 r2 d2 
  d4. g8 g4 g g g r2
  R\breve*2
  
  %78
  \barNumberCheck #78
  | r2 g1 c2 
  b4 a2 d,4 g2 e 
  r2 e g4. f8 e4. d8 
  c1 r1
  R\breve*3
  
  %85
  \barNumberCheck #85
  | r1 r4 a'4 d2 
  d4. c8 b2 r4 a4. g8 \ficta fis4 
  r2 d4. d8 g4 b4. a8 g f 
  e4 c d2 r1
  R\breve*6
  
  %95
  \barNumberCheck #95
  | r1 r2 e2 
  a a r2 a 
  a a f4 a a2 
  r4 a a4. g8 f2 r2
  r1 r4 a4 c2 
  g e4 g2 d4 r4 g 
  g4 g g2 g r2
  R\breve*6
  
  %108
  \barNumberCheck #108
  | r1 r2 e1 %tie
   e2 e e 
  e2 e4 e a1. %tie1.
   g2 a e 
  r2 a2. g4 a b 
  c2 b a e 
  e1 r1
  R\breve*7
  
  %122
  \barNumberCheck #122
  | d1 b2 g 
  d'2. g2 f8 e d4 b 
  r4 d d2 r1
  r1 r2 a'2 
  a2 a4 a c2 a 
  a1 r2 d,1. %tie21
  d1 
  r1 f2 bes, 
  r4 g' g2 r2 r4 d4. %tie4.
   b8 b g g2 r4 g'2 g4
  g4 g g2 g r2 
  r4 g2 b4 e,1 
  r2 c' c4 c2 b8 a 
  b2 b r2 b2
  b2. g4 g1~
  g\longa
}

notesVTenor = \relative c {
  R\breve*23

  %24
  \barNumberCheck #24
  r2 c'2 c c 
  f1. bes,2 
  c a \ficta bes2. a4 
  g2 c4. \ficta bes8 g1 
  f2. g4 a1 
  f2. a4 g2 d 
  r2 d' g,4 c e2
  e4. d8 c4 e a,1 
  r2 g d' d 
  g1 c,2 e 
  e2. b4 c4. d8 e4 c 
  d2 g, r1
  R\breve*4
  
  %40
  \barNumberCheck #40
  r1 r2 g'2 
  g2 g c, r2
  r4 c2 e4 g c, c2. %tie2.
   c4 g2 r4 b d2 
  r2 d,2. g4 d2 
  r2 r4 d'4 d g2 d4 
  d2 r2 r1
  R\breve*4
  
  %51
  \barNumberCheck #51
  f1 c2 e2. %tie2.
   d4 b2 d4 d f4. f8 
  e4 c2. d2 d 
  d4 f2 c4. d8 e c d1 %tie
   a2 r4 c2 e2 %tie44
   g2 d4 d2 r4 c2 %tie44
   c4 e2 b4 d4. c8 b4 
  r4 d g2 d r2
  R\breve*10
  
  %69
  \barNumberCheck #69
  r2 g,4 d'2 d4 b2 
  r2 c4 g'4. e8 e4 r2 
  c4 g'2 c,4 g c4 c e2 %tie44
  c4. g8 g4 r1 
  e4 a2 a4 r2 r4 g4. %tie4.
   d'8 d2 d4 r2 b4 b4. %tie4.
   c8 d2 d4 r2 r4 c4. %tie4.
   b8 d4. c8 a4 r1
  R\breve
  b1 c2 c 
  d d e2. b4 
  d2 c b1 
  a r1
  R\breve*4
  
  %86
  \barNumberCheck #86
  r1 a4 f4. e8 d4 
  r4 b' b2 r4 g4. g8 g4 
  g2 g r1
  R\breve*6
  
  %95
  \barNumberCheck #95
  r1 r2 g2 
  d'2 c r2 c 
  d4 d c2 f, r2
  r4 a4. b8 c4 d2 r2
  r1 r4 f4 e2 
  d4 d g,2 d' r4 c 
  d4 d e c d2 r2
  R\breve*6
  
  %108
  \barNumberCheck #108
  r1 r2 cis1 %tie22
  cis2 cis r4 c 
  c2 c4 c e2 a, 
  r2 e a b 
  c1 b 
  R\breve*9
  
  %122
  \barNumberCheck #122
  g4. a8 b4. c8 d2. e8 f 
  g4 d d2 r4 d b d2 %tie44
   a4 a2 r1
  r1 r2 c2 
  c4 c c f2 c4 c2 
  r1 bes4 d4. c8 bes2 %tie44
  f'4 r4 g d2 r2 
  d2. a4 d2. \ficta bes4 
  c2 g r4 d' a2 
  r1 r4 d2 d4
  d4 b b2 r4 c2 e4. %tie4.
   c8 c4 r2 c4 g g2 
  r2 g'2. e4 e2 
  r4 b b4. a8 g2 r4 g2 %tie44
   b4 b2 r2 b 
  b\longa
}

notesVBaritone = \relative c {
  R\breve*23

  %24
  \barNumberCheck #24
  r1 r2 f2 
  f f bes1 
  a2 f g g 
  c,1 r2 c' 
  c4. \ficta bes8 a4. g8 f2. g4 
  a2 d, d\breve %tie11
    r2 g 
  c, c c1 
  r4 g'2 e4 f4. g8 a2 
  r2 e1 a2 
  g2 e r1
  R\breve*5
  
  %40
  \barNumberCheck #40
  r2 g2 b4 b4. c8 d4 
  r2 g, g g2. %tie2.
   g4 g2 r2 g1 %tie
   c,2 r2 r4 g'2 %tie44
   d2 d' g,4 d' g, 
  g1 r1
  R\breve*4
  
  %50
  \barNumberCheck #50
  r1 r4 f2 c2 %tie44
   c'2 c4 b g a2 
  d,2 r2 r2 bes'1 %tie22
  f2 a g
  g1 r1
  r2 g2. g4 a2. %tie2.
   f4. g8 a f g2 r2
  r2 c4 f,4. g8 a4 e1 %tie
   g2 d r2
  r1 d2 g 
  d r2 r1
  R\breve*9
  
  %70
  \barNumberCheck #70
  c2 e2. e4 g2 
  r2 r4 e4 e2 e 
  g4. g8 g2 r2 c4 c2 %tie44
   a2 c4. c8 c4 g4. a8 
  | b4 g g2 r2 g 
  g4. b8 b4 b r4 c g2 
  R\breve
  r1 r2 d'1 %tie
   g,2 g4 c4. b8 a g 
  f4 d4. e8 f4 c2 r2 
  d4 a'4. e8 a4 g e r4 e 
  e2. a4 f d a'2 
  R\breve*4
  
  %86
  \barNumberCheck #86
  r2 d2 d d 
  r2 g,2. g4 g2 
  c, g' r1
  R\breve*6
  
  %95
  \barNumberCheck #95
  r1 r2 e2 
  d2 e r2 a 
  d, e4 a2 d,4 e2 
  r4 d a'2 d, r2 
  r1 r4 d4 e c 
  g'4 g g2 g r4 c, 
  g'4 g c,2 g' r2
  R\breve*6
  
  %108
  \barNumberCheck #108
  r1 r2 a1 %tie
   a2 a1 
  r2 a a a4 a 
  c2. b4 a2 g 
  a1 e 
  r2 g a b 
  c1 b 
  R\breve*7
  
  %122
  \barNumberCheck #122
  g1. g2 
  d r4 d2 g4 g2 
  R\breve
  r2 a2 a4 a a c2 %tie44
   a4 r4 a2. f4 a2. %tie42
    f4 c' r2 r4 f,4 
  f4 bes bes d2 d4 r4 d,2 %tie44
   a'4 f d d2 r4 g2 %tie44
   c,4 c2 r4 d2 d'4
  d4 d, g d r4 g g g 
  g d'2 g,4 r4 g2 c,4 
  | e4. f8 g2 r2 c 
  | c4 c c c2 c4 r2 
  d1 b2 b4. c8 
  d2 r4 d,2 e8 f g2 
  d\longa
}

notesVBass = \relative c {
  R\breve*26
  c1 c2 c 
  f1 f2 d 
  r2 d g, g'2. %tie2.
   f8 e d2 c1 
  r1 r2 e2 
  e2 e a f 
  g2. f4 e2 c4 a 
  e'1 a, 
  R\breve*5
  
  %40
  \barNumberCheck #40
  r2 g2 d'2 d 
  c2 c g' g4. f8 
  e4. d8 c2 e e 
  c1 r2 d 
  g b1 g2 
  b b4. a8 g1 
  R\breve*4
  
  %50
  \barNumberCheck #50
  r2 d1 a2 
  c c g d' 
  d f4 f c2 r2
  | r2 f1 c2 
  e d1 a'2. %tie2.
   g4 e2 g4 g f2 
  | d4 a'4. g8 f4 e c g'2 
  R\breve*12
  
  %69
  \barNumberCheck #69
  r1 g2 g1 %tie
   c,2 g' r4 c, 
  e2 e g4 g c,2 
  g'4 e2 c4 c2. c4 
  c4. d8 e2 r2 g2. %tie2.
   d4 d2 r2 d 
  b4. c8 d4 g, r4 g'2 c4 
  f, a2 d,4 g2 r2
  R\breve
  
  %78
  \barNumberCheck #78
  g1 c,2 e 
  d f e1 
  d2 a e'1 
  a,1 r1
  R\breve*4
  
  %86
  \barNumberCheck #86
  r2 d2. a'2 d,4 
  r4 d4. b8 b4. c8 d4 r2
  R\breve*11
  
  %99
  \barNumberCheck #99
  r1 r4 d4 a2 
  b4 g c2 g r2
  R\breve*7
  
  %108
  \barNumberCheck #108
  r1 r2 e'1 %tie
   a,1 e'2 
  e1 r1
  R\breve*11
  
  %122
  \barNumberCheck #122
  d1. g,1 %tie
   d'2 d\breve %tie11
    r1 
  r1 r2 f2 
  f2 f4 f a1 
  f1 r2 f 
  d g g1 
  r2 a f g 
  r4 e2. a2 d,2. %tie2.
   g4 g2 r2 g, 
  g2 g4 g c1 
  c2 g c c4 c 
  g'1 e 
  d1. b2 
  b4. c8 d2 r2 g, 
  g\longa
}

% ------------
% Choir 6
% ------------

notesVISoprano = \relative c {
  R\breve*24

  %25
  \barNumberCheck #25
  r1 r2 g''2 
  c2 c g'2. f4 
  e4 c e2. d4 c2
  c2 r2 a a 
  a2 d2. c4 b g 
  b1 c2 c2. %tie2.
   a4 c2. b4 a2 
  g e r1
  r4 g4 b e,2 a e2 %tie44
   g4. f8 e4 r2 e4. f8 
  g4 d g2 r1
  R\breve*4
  
  %40
  \barNumberCheck #40
  r2 b2 b4 d2 b4 
  r2 r4 c4. g8 g4. d8 d4 
  r2 r4 g4 e e'2 e4 
  e4 c c2 r2 r4 g4 
  | d'2. g2 g4 g2. %tie24
  d2. d1 
  R\breve*5
  
  %51
  \barNumberCheck #51
  r1 r2 f1 %tie
   c2 e d2. %tie2.
   d4 c2 r2 r4 c2 %tie44
   g2 b d4. c8 c2 %tie44
   g4 r4 g g d'4. d8 d4 
  d2 c c r2
  R\breve*13
  
  %70
  \barNumberCheck #70
  r2 g1 c2
  c4. d8 e2 r4 e,2 
  g4 g c c g r2 r4 c4 
  c4. a8 a4 e'2 e, g2 %tie44
   b4 b2 r2 g' 
  g4 g g2 g,4 g2 g4 
  r2 r4 a2 e4 g2 
  R\breve
  g2 d'4 d c4. b8 g2 
  r4 f d a' e g g2 
  r4 d a'2 b1 
  c2 a a1 
  R\breve*4
  
  %86
  \barNumberCheck #86
  r4 b4 d2. d,2 a'4 
  r2 b2. b4 d2 
  e d r1
  R\breve*6
  
  %95
  \barNumberCheck #95
  r1 r2 b4. c8 
  d4 a c2 r2 c 
  f,4 a4. e8 e4 r2 e4 a2 %tie44
  f4 r4 a a2 r1
  r2 a4 d4. c8 c4 
  d2 r4 g, b d g, e 
  g4 g e2 g r2
  R\breve*6
  
  %108
  \barNumberCheck #108
  r1 r2 a2. e'2 cis4 cis1 
  r2 c c c4 c 
  e2. d4 c2 b 
  a e' e1 
  r2 e,2. f4 g2 
  e4 a4. b8 c a b1 
  R\breve*7
  
  %122
  \barNumberCheck #122
  g2 d'2. b2 g2 %tie44
   d'2 b4 b2 r2
  r4 a2 a4 a f c'2 
  a4 c2. f,4 a2 f4 
  r4 c' c c c f2 f,4 
  c'4 a2. r4 bes2. 
  f'2 r2 r4 d4 bes2 
  r4 f'2. f2 r2
  r4 c2. a2 r4 d2. %tie42
    d2 r2 b 
  b g4 g g2 g 
  r1 r2 g'2 
  g4 g g g2 g4 r4 g,2 %tie44
  d'2. d1. %tie1.
   b2 b1~
  b\longa
}

notesVIAlto = \relative c {
  R\breve*26

  %27
  \barNumberCheck #27
  g''1 g2 g 
  a1. f2 
  f2 f g r4 g2 %tie44
  b4. a8 g2 e4 g c, 
  r4 a'2 e c4. d8 e2 %tie44
   e2 e4 a, a d2 
  r2 g c a4 c4. %tie4.
   b8 b2 g4 a a e2 
  R\breve*5
  
  %40
  \barNumberCheck #40
  r2 g2 g4 g2 d4 
  r4 c g2. g'2 g4 
  g2 r2 g4 c4. g8 g4. %tie4.
   e8 e c g'2 r2 g4 d'4. %tie4.
   b8 b g g2 r4 d2 e8 f 
  g2. b2 g4 g2 
  R\breve*4
  
  %50
  \barNumberCheck #50
  r1 r2 c1 g2 b4 b a2 
  r4 a a c4. c8 g2 bes2 %tie44
  f4 a2. f4 g2 
  e4 g2 d4 g2 r2
  r4 c,4 e g2 d4 f a2 %tie44
  a4 r4 a e g g2 
  R\breve*12
  
  %69
  \barNumberCheck #69
  r2 b2 b4 b b2 
  r2 r4 c4 g2 c,4 c2 %tie44
  c4 c2 r2 r4 c4 
  c4. d8 e2 r4 f2 a4 
  a4 c4. c8 c4 r4 c, c e 
  r4 g4. g8 g4 r2 g4 g4. %tie4.
   g,8 g2 g4 r2 e' 
  a,4 a' a2 r1
  R\breve
  r2 d,2 g4. f8 e4. c8 
  r4 d a'2 c b2. %tie2.
   a4 a1 gis2 
  a e r1
  R\breve*4
  
  %86
  \barNumberCheck #86
  b4 d2 g,4 r4 d' d2 
  r2 g2. g4 g2 
  g2 g r1
  R\breve*6
  
  %95
  \barNumberCheck #95
  r1 r2 g2 
  f4 a4. g8 e4 r2 e4 a2 %tie44
  a4 c a a2 r2
  r2 e4 a,2. a2 
  r1 d4 a'2 a4 
  r4 g g2 g r4 g2 %tie44
   b4 c g2 b4 e,2 
  R\breve*6
  
  %108
  \barNumberCheck #108
  r1 r2 a1 %tie
   a2 a\breve %tie11
    r2 e 
  e e4 e e2. d4 
  c2 a b g2. %tie2.
   a4 b2 c4 a e'2. %tie2.
   d4 c2 g4 b2 c8 d 
  e1 r1
  R\breve*6
  
  %122
  \barNumberCheck #122
  d2 g,4 d'2 g d4 
  r4 d2 d4 d2 r2
  r4 f2 f4 f f a2 
  | f2 r4 c' c c f,4 a2. %tie42
  f2 r4 c' c2 
  r2. f,4 bes,1 
  r1 bes'2. d4 
  d2 d, d r2
  r4 e2. a,1 
  r2 d d4 d g, g'2 %tie44
  d4 d2 r4 e4. f8 g4 
  | g2 r2. c,2 c'4 
  c2 r4 c,2 e4. d8 c4 
  r4 g'2. d2 g, 
  r2 d' d1~
  d\longa
}

notesVITenor = \relative c {
  R\breve*23
  r1 r2 c'2 |
  c2 c d1 
  e2 f d2. d4 
  c1 r2 c 
  c c f1 
  f2 d r2 d2
  d2. e8 f e2. c4 
  e2 a, r2 a 
  b4 a b c d c b a 
  e'1. a,2 
  b b a1 
  R\breve*5
  
  %40
  \barNumberCheck #40
  r2 d2 d4 b b2 
  r4 c2 e4. c8 c4 r2 
  c4 g g2 r2 g'2. %tie2.
   e4 e2 r4 b b4. a8 
  g2 r4 g2 b4 b2 
  r2 b2. b4 b2 
  R\breve*3
  
  %49
  \barNumberCheck #49
  r1 r2 g'1 %tie
   d2 f1 
  e2. c4 d2 d1 %tie
   a2 c d1 %tie
   a2 c1. %tie1.
   d2 g, r4 c4. %tie4.
   d8 e f g4 g,2 b4 d d, 
  a'1 g 
  R\breve*13
  
  %70
  \barNumberCheck #70
  g'2 g1 g2 
  g r2 g e 
  c2 g' c,4 f4. e8 f d 
  e2 r2 r4 g,2 g4 
  g2 r2 r2 d'2 
  d4 d d4. f8 e4 c r4 c4. %tie4.
   a8 b c d e f4 r4 c g2 
  R\breve
  
  %78
  \barNumberCheck #78
  d'2. g2 e4 g2 
  d4 f4. e8 d4 c4. d8 e2 
  r2 a,4 e'2 d8 c b4 e 
  e1 r1
  R\breve*3
  
  %85
  \barNumberCheck #85
  r1 r2 a,4 d2. %tie42
  d2 r1
  r2 g,2. g4 b2 
  c b r1
  R\breve*6
  
  %95
  \barNumberCheck #95
  r1 r2 e2 
  a,2 e' r2 e4 a,2 %tie44
  f4 a e r4 a2 e4 
  r4 a c2 f, r2
  | r1 a4 a2 e4 
  r4 b' e2 b r4 e, 
  b'4 b e,2 b' r2
  R\breve*6
  
  %108
  \barNumberCheck #108
  r1 r2 e1 %tie
   e2 e\breve %tie11
    r1
  R\breve
  r2 e e e4 e 
  | g2. f4 e2. d4 
  c2 a e'2. d4 
  c4 b e1 a,2 
  R\breve*6

  %122
  \barNumberCheck #122
  b2. g2 d' b4. %tie4.
   c8 d2 g,4 r d' d2
  r4 d,2 a'4 f a a2
  r4 c2 c4 c f, f'2. %tie24
  c4 c2 r2 r4 f2 %tie44
  f4 f f f2 f
  r4 d2 bes4 bes2 r2
  r4 f2 f4 a d r4 g,2 %tie44
  g4 e2 r1
  r4 d d g g g d2
  r2 r4 g4. e8 e'4. d8 c4
  c2 r4 g4 g2 r2
  g2 c4 c c c2 c4
  r2 g'2 g4 g g g2 %tie44
  g4 r2 r4 g,2 d2 %tie44
  g2 f8 e d\breve.
}

notesVIBaritone = \relative c {
  R\breve*25
  r1 r2 g'2 
  g g c c4. \ficta bes8 
  a4. g8 f4. e8 d2 d4. e8 
  f8 g a2 d,4 r4 d'2 g,4 
  g\breve 
  e1 e2 e2. %tie2.
   c4 g'2 r1 
  e2 g r4 c,2 c'4 
  g4 e g2 c,1 
  R\breve*5
  
  %40
  \barNumberCheck #40
  r2 g'2 g4 g g2 
  r2 r4 e4 e2 r2 
  c c4 g'4. f8 e4. d8 c4 
  c'2 r2 r2 g2 
  g2 g1 g2 
  r1 g2. g4 
  d2 r2 r1
  R\breve*2
  
  %49
  \barNumberCheck #49
  r2 d'1 g,2 
  b2 b a1 
  g1. f4 d 
  a'2. a4 g1 
  r2 c4 f,4. g8 a4 e2 
  r2 g1 c,2 
  e2. e4 d2 r4 d'2. %tie42
    a2 c bes4 g 
  d'2 r2 r1
  R\breve*11
  
  %69
  \barNumberCheck #69
  r1  b2 b4 b4 
  g2 g2. e2 c2 %tie44
   e4. f8 g4 r4 c c2 
  g r2 c4 f, f2 
  r4 c' c2 g4 c2 b8 a 
  d4 b d2 r2 r4 d,4 
  d4. b8 b4 b r4 g' g2 
  R\breve
  
  %77
  \barNumberCheck #77
  r1 r2 d1 %tie
   g2 e4 g2 g4 
  b4 d2 a4 r4 e g2 
  a4 d, e c r4 e g2 
  c,4. d8 e2 r1
  R\breve*3
  
  %85
  \barNumberCheck #85
  r1 r2 r4 d4 
  g2 g r2 r4 d4 
  d2 d r1
  R\breve*7
  
  %95
  \barNumberCheck #95
  r1 r2 g2 
  a2 a r2 a 
  a2 a a a 
  r4 a a2 a r2 
  r1 r4 a2 c4 
  b2 c4 g4. a8 b4 r4 g 
  | g4 g g2 g r2
  R\breve*6
  
  %108
  \barNumberCheck #108
  r1 r2 e1 %tie
   e2 e\breve %tie11
    r1
  R\breve
  r1 r2 e2 
  e2 e4 e a2 g 
  a1 e 
  R\breve*7
  
  %122
  \barNumberCheck #122
  g1. g2 
  g\breve 
  r2 r4 f2 f4 f c2 %tie44
   a'2 f4 r4 a a2 
  r4 a c2 c r2
  r4 f,2 f4 f f r4 bes2. %tie42
  bes2 r1 
  a2 d2. d,4 d2 
  r1 a'4 d4. c8 a4 
  r4 d4. g,8 g4 r2 g 
  b4 b4. c8 d4 r2 g, 
  g1 g 
  r2 g1 c,2 
  r2 r4 g'2 d d'2 %tie44
  g,4 d' g, r2 g 
  | g\longa
}

notesVIBass = \relative c {
  R\breve*28
  r1 g1 
  g2 g c1 
  r2 a a a 
  e'1 d2 f 
  e2. e4 a,1 
  R\breve*6

  % 40
  \barNumberCheck #40
  r2 d2 g,4 g g'1 %tie
   e2 c d
  e1 c2 g'
  r2 g g r4 g,2 %tie44
  d'4 d2 r2 d2
  b2 d2 d1
  R\breve*2

  %48
  \barNumberCheck #48
  r1 r2 g1 %tie
   d2 f e
  d2 f1 c2
  e2 e d1
  f1 e4 c g'2
  r1 r2 c,1 %tie
   g2 b a
  c1 g2 d'
  d2 f4 f c2 r2
  R\breve*12

  %69
  \barNumberCheck #69
  r1 g'1
  e2 e c r4 c4
  g'2 g4 g2 e4 e2. %tie2.
   e4 e2 r2 c
  c2 a e'2. e4
  d4. c8 b2 r2 b'2
  b4 g g2 c,4 e4. f8 g4
  R\breve*2

  %78
  \barNumberCheck #78
  r2 g2 g c,
  f2 a g2. e4
  f4. g8 a4 e4. f8 g a b4 e,2 %tie44
  a4 a2 r1
  R\breve*4

  %86
  \barNumberCheck #86
  r2 g2 f4 d r d2 %tie44
  b4. g8 g4 d'2 r2 
  R\breve*11

  %99
  \barNumberCheck #99
  r1 r4 d a'2
  d,4 d e2 d r2
  R\breve*7

  %108
  \barNumberCheck #108
  r1 r2 a1 %tie
   cis2 e a,
  a1 r1
  R\breve*11

  %122
  \barNumberCheck #122
  | g1 b2 d1 %tie22
  b4 g d'2 g,2
  R\breve
  r1 r2 c2
  c2 c4 c f2 c
  r2 c d1 
  bes2 d1 g,2
  r2 r4 d' a'2 g4. f8
  e4 c g'2 r2 d1 %tie22
  b2 d r
  r4 g2 g4 g e g2
  g2 r2 r2 c,
  c2 e1 c2
  | g'2 g g2. f8 e
  d1 r2 b2
  b\longa
}

% ------------
% Choir 7
% ------------

notesVIISoprano = \relative c {

  R\breve*28
  r1 d''1 
  d2 d e1 
  c2 a e'2. e4 
  e1 r2 d 
  b1 r4 c2 e2. %tie42
    b4 e2 d4 c2 
  r2 g e a 
  e1 r1
  R\breve*2
  
  %39
  \barNumberCheck #39
  r2 g2 c c 
  g' r2 d d4 d 
  e1. d2. %tie2.
   c4 c1 c2 
  g r4 g2 f8 e d2. %tie2.
   d4 d2 r2 d'1 %tie
   g,2 b1 
  a2 g4 e f d4. e8 f g 
  a2. f4 g2 e 
  g1 r2 c,4 c 
  g'2. d4 d2 r2
  r4 d'2 f4. e8 d4 r4 c2 %tie44
   e4 g g,2 d'4 d2. %tie2.
   a2 f4 g2. f8 e 
  d4 f r4 c' f2 e4. d8 
  c4. a8 b c d2 g,4 c a 
  r4 e'4. d8 c4 b g r4 d 
  f d a'2 r4 e g2 
  R\breve*13
  
  %70
  \barNumberCheck #70
  c4 g'2 e4 e2 r2
  r4 c4 g2 g4 g4. g8 g4
  | r2 g' f2. c4 
  r4 c c a r4 e g c, 
  g'1 r2 g 
  g g4 g'2 g,4. c8 c4 
  r4 f,4. e8 d4 r4 g2 b4 
  c a e'4. d8 c2 a 
  b1 r1
  R\breve*7
  
  %86
  \barNumberCheck #86
  r2 d2 d1 
  d1 r1
  R\breve
  r2 d2. d4 b2 
  g2 a r1
  R\breve
  r2 c2. c4 c2 
  a4 d2 b4 r2 g 
  e4 g2 d4 r2 g 
  e b' e,4 e' e2 
  R\breve*3
  
  %99
  \barNumberCheck #99
  r4 d4 c8 b a g f4 a a2 
  R\breve*2
  
  %102
  \barNumberCheck #102
  r2 r4 e'4 c2 c 
  r1 a2 e'4 e 
  a, a r2 r1
  R\breve*3
  
  %108
  \barNumberCheck #108
  r1 r2 e'1 %tie
   e2 e\breve %tie11
    r1
  R\breve*11
  
  %122
  \barNumberCheck #122
  d1. d2 
  d2. e8 f g4 g,2 d'4 
  d1 r1
  r1 r2 a2 
  a4 a a c4. \ficta bes8 a4. g8 f2 %tie44
   c'4 c2 r1
  r1 r2 d2 
  d4 d d f4. e8 d4 d2 
  g,4 c4. \ficta bes8 g4 d'1 
  r2 r4 b2 b4 d2. %tie2.
   g,4 b2 g r4 g'2 %tie44
  g4 g g g2 g 
  | r2 g, c4. d8 e2 
  r2 d4 b2 g b4. %tie4.
   a8 g4 r4 d'2 b4 r4 g'
  g2 r4 g2 d g4 
  g\breve
}

notesVIIAlto = \relative c {
  R\breve*27

  %28
  \barNumberCheck #28
  r1 r2 a''2 
  a a b1 
  r2 g g g 
  c2. b4 a e a1 %tie
   g2 r2 f4 a 
  g4. f8 e2. a,4 c4. d8 e4 
  b4 r e f a2. 
  d,4 g r4 g c2 a2. %tie2.
   b4 c2 f,1 
  R\breve
  r2 g g g 
  bes1 a2 a 
  \ficta bes4. a8 g1 g2 
  g r2 r4 g2 b4 
  e,1 r2 c' 
  c2. b8 a b1 
  b2 b b2. g4 
  g\breve 
  R\breve*24
  
  %70
  \barNumberCheck #70
  r2 g2 c4 c c2 r2
  r4 g4 c2 g4 g4. %tie4.
   g8 g4 r2 r4 c,2 f4. %tie4.
   e8 c4 r2 c'4 c2 g4 
  r4 g4. a8 b4 r2 b 
  b2 b c2. c4 
  a d, a'2. g4 g2. %tie2.
   f4 a2. e4 f2 
  g1 r1
  R\breve*7
  
  %86
  \barNumberCheck #86
  d4 d2 d4 r1
  r4 d4 d4. c8 b2 r2
  R\breve
  r2 d4. d8 g4 b4. a8 g f 
  e2 e r1 
  R\breve
  r2 e2. e4 e a4. %tie4.
   e8 f4 g2 r2 g 
  g g r2 g 
  g g c, g 
  R\breve*3
  
  %99
  \barNumberCheck #99
  r4 d'4 e2 f r2
  R\breve*2
  
  %102
  \barNumberCheck #102
  r2 r4 g4 c,2 g' 
  r1 d4 a'2 c4 
  f, f r2 r1
  R\breve*3
  
  %108
  \barNumberCheck #108
  r1 r2 e1 %tie
   e2 e\breve %tie11
    r1
  R\breve*11
  
  %122
  \barNumberCheck #122
  g1. g2 
  g\breve 
  R\breve 
  r1 r2 f2 
  f4 f f a2 f4 c'1 %tie
   f,2 r4 f2 bes,4
  bes4 bes'4. a8 g4 r2 d 
  d1 r2 r4 g4. %tie48
  e8 e c c2 r1
  | r4 b2 b4 b b g2 
  g2 r2 r2 r4 g'4 
  g4 g g g2 c,4 c2 
  r4 g'4. e8 e4. c8 c2 e4 
  g2 r2 r2 r4 g,2 %tie44
   g'2 d4 r4 d2. 
  b4 d g, g' g\breve.
}

notesVIITenor = \relative c {
  R\breve*28

  %29
  \barNumberCheck #29
  r2 d'2 d d 
  g1 r2 c, 
  c2 e e1 
  e2 b r2 d 
  g,4 b e, e'2 c4 c2 
  r1 r2 a2 
  bes2 bes c c4 c 
  c2 a a1 
  R\breve
  r2 d2 c g' 
  g1 c,2 f 
  bes,4 d2 g,4 g2 r2 
  e4 e'2 c4 c2 r4 g 
  g2 r2 g4 g c2. %tie2.
   c4 c2 r2 g' 
  g2 g g r2 
  r4 b,2 d, d'4 b4. c8 
  d2 e4 c d1. %tie1.
   c2 c1
  b1 r1
  R\breve*20
  
  %69
  \barNumberCheck #69
  r1 d2 g,2. %tie2.
   g4 g2 r4 g' e2 
  c g'4 g c,2 c4 c2 %tie44
   c4 r4 e2 a,4 a2 
  r2 e e e 
  r4 b'4. g8 g4 r2 g4 g' 
  g4 g2 d4 r4 c4. b8 g4 
  r2 d' e4 c d2 
  r2 a e a4 d2 %tie44
   g,4 b2 r1
  R\breve*7
  
  %86
  \barNumberCheck #86
  d2 g r4 d d2 
  r2 b d g, 
  R\breve
  r2 d'2. d4 g, g2 %tie44
   e4 e2 r1
  R\breve
  r2 e'2. c4 c2 
  r4 d b2 r2 b4 d 
  c4. a8 b2 r2 b 
  g b e e 
  R\breve*3
  
  %99
  \barNumberCheck #99
  a,4 d2 cis4 d2 r2
  R\breve*2
  
  %102
  \barNumberCheck #102
  r2 r4 g4 f2 e 
  r2 r4 g4 f f e2 
  d r2 r1
  R\breve*3
  
  %108
  \barNumberCheck #108
  r1 r2 a1 %tie
   a2 a\breve %tie11
    r1
  R\breve*11
  
  %122
  \barNumberCheck #122
  d1. d2. %tie2.
   b2 d g,4 b2 
  | a1 r1 
  c2 c4 c c f2 c2 %tie44
   f,4 a2 r2 c2. %tie2.
   c2 a4 r4 d bes f' 
  f2 r4 \ficta bes,2 d4. c8 bes4 
  r2 r4 a4. f8 f d d2 
  r1 r2 d'2. %tie24
  d4 d d g2. d4 
  | d2 r2 r2 e2 
  | e2 r2 e g 
  g r2 g, c 
  b4 g d'2 r2 d1. %tie21
  d1~
  d\longa
}

notesVIIBaritone = \relative c {
  R\breve*27

  %28
  \barNumberCheck #28
  r2 a'2 a a 
  d2. c4 b2 b 
  b2. b4 e,2 e 
  a a c1 
  g1 a 
  b2. b4 a1 
  R\breve*4
  
  %38
  \barNumberCheck #38
  r2 g2 g g 
  g4. a8 bes4 g a2 f 
  bes2 r4 g d2 d 
  r4 g c2. b8 a d2 
  g,2 c r4 g e2 
  g4 c,2 g'4 r4 d'4. b8 b4 
  r2 b b1 
  r2 g2. g4 d'2 
  r2 c f, f 
  d a' r1 
  r2 d1 g,2 
  b1 a2 g 
  R\breve*19
  
  %69
  \barNumberCheck #69
  r1 r2 g2. %tie2.
   c2 c4 c2 r4 g2 %tie44
  e2 c g' c,4 
  c2 r2 c4 c2 c4 
  r4 a' a a g e e2 
  r2 d8 d d4 r2 d' 
  d4. g,8 g4 g g g r2
  r2 f2 c4 e r4 g 
  c,2 c' c f,4 a 
  r4 d d2 r1
  R\breve*7
  
  %86
  \barNumberCheck #86
  g,2 d d r2
  r4 d4 d'2 g, d' 
  r4 g, g2 r1
  R\breve*3

  %92
  \barNumberCheck #92
  r2 e4. e8 a4 c4. b8 a g 
  f4 d d2 r2 b 
  e2 b r2 b 
  e b c4 e4. f8 g4 
  R\breve*3
  
  %99
  \barNumberCheck #99
  r4 d4 a'2 d, r2
  R\breve*2
  
  %102
  \barNumberCheck #102
  r2 r4 e4 f2 g 
  r1 f4 d e a2 %tie44
  a4 r2 r1
  R\breve*3
  
  %108
  \barNumberCheck #108
  r1 r2 cis1 %tie22
  a2 a\breve %tie11
    r1
  R\breve*11
  
  %122
  \barNumberCheck #122
  b1. b2 
  b1 r2 g 
  f2 d4 d a'2 f 
  f\breve 
  f1 r2 f1 %tie
   c'4 f, f1 
  r2 r4 d2 g4 g2 
  r4 a4. g8 f4. d8 d'4 d2 
  | r1 r4 d,4. e8 \ficta fis4 
  | r2 g2. g4 g g 
  | g2 g r2 r4 e4 
  | e2 r2 c2. g'4. %tie48
  f8 e4. d8 c4 c'2 r2 
  r2 g1. 
  g1 r1 
  b1 b\breve.
}

notesVIIBass = \relative c {
  R\breve*27

  %28
  \barNumberCheck #28
  r1 r2 d2
  d2 d g2. f8 e
  d2 g2. f4 e2 
  a,2 e'2. e4 a,2
  R\breve*5

  %37
  \barNumberCheck #37
  r1 r2 d2
  d4 d g1 c,2
  g1 r1
  r2 g g g
  c1. g2
  c2 c g'1
  e2 e d1. %tie1.
   b2 b4. c8 d2
  r4 g,2 g4 g1
  r1 r2 d'1 %tie
   a2 c c
  g2 g4 g d'2 c
  b4 g2. d'2 r2
  r\breve*19

  %69
  \barNumberCheck #69
  r1 g1
  g1. g2
  g1 r2 g
  e2 c f2. f4
  c2 c2. e4 c g'2 %tie44
  g4 g2 r g
  g2 g e e
  a2 f g1
  a\breve
  g1 r1
  R\breve*7

  %86
  \barNumberCheck #86
  r2 b2 a1
  g1 r1
  R\breve*4

  %92
  \barNumberCheck #92
  r2 a2. a4 a2
  a2 g r g
  g2 g r g
  g2 g e e
  R\breve*6

  %102
  \barNumberCheck #102
  r2 r4 g4 a2 e
  r1 a4 a2 a4
  f4 d r2 r1
  R\breve*3

  %108
  \barNumberCheck #108
  r1 r2 e1 %tie
   e2 e\breve %tie11
    r1
  R\breve*11

  %122
  \barNumberCheck #122
  g1. g2
  g1 r2 d2
  d2 d4 d f1 
  c1 r1
  r2 f2 f f4 f
  a1 f2 r
  d4 f bes,2 d1
  r2 d2. d4 d d
  c2 c f f4. e8
  d2 r2 r4 d2 d4
  g,4 g g'1 e2
  c2 d e1 
  c2 g' r g
  g2 r4 g,2 d'4 d2
  r2 d2 b2 d
  d\longa
}

% ------------
% Choir 8
% ------------

notesVIIISoprano = \relative c {
  R\breve*32

  %33
  \barNumberCheck #33
  r2 e''2 e e 
  g1 f2 e2. %tie2.
   d4 d1 c4 b 
  c4. d8 e4 a,2 b8 c d2 
  r1 r2 d2 
  d2 d e1. %tie1.
   d2. c4 c1 %tie
   b1 g2 
  g1 r1 
  r2 g'2 g g 
  g2 r4 g,2 d'2 %tie44
   d2 d4 d1 b2 
  b1 r1
  R\breve
  r1 r2 g'1 %tie
   d2 f e 
  d d a c 
  b4 a8 g f4 d a'2. f4 
  g2 e r2 r4 f2. %tie42
  a2 e g 
  R\breve*16
  
  %69
  \barNumberCheck #69
  r1 r2 g1 %tie
   c1 c2 
  c2 r4 c2 e c2 %tie44
   e4. e8 e4 r4 a, c f, 
  r4 a4. e8 e4 r2 r4 g2 %tie44
   d'4 g, d' r2 d 
  d2 d e e 
  f1 e2 d 
  c1 a2 d 
  d1 r1
  R\breve*7
  
  %86
  \barNumberCheck #86
  g,4 d'2 d4. a8 a4 r2 
  b4 g4. a8 b4 b2 r2
  R\breve
  r2 b2. b4 d2 
  e c r1
  R\breve
  r2 e2. e4 a,2 
  d d r2 d 
  g, d' r2 d 
  g, d'4. g,8 a b c a b2 
  R\breve*3
  
  %99
  \barNumberCheck #99
  r4 f'4 e2 d r2
  R\breve*2

  %102
  \barNumberCheck #102
  r2 r4 c4 c4. d8 e2 
  r1 a,4 d2 cis4 
  d d r2 r1
  R\breve*3
  
  %108
  \barNumberCheck #108
  r1 r2 cis2. %tie24
  b4 a2. g8 f e4 a4
  a4. b8 c d e4 r1
  R\breve*11
  
  %122
  \barNumberCheck #122
  g1. g2 
  g2 d d d4 d4 
  f1. c1 %tie
   f,2. c'4 c2 
  r2 a a4 a a c2. %tie42
    a4 c r4 bes4. a8 f4 
  f2 r2 r2 d'2 
  d,4 f2. f2 r2
  r4 g4. e8 e4 r4 a a2 
  | r2 r4 d2 d4 d d 
  | g1 g2 r2 
  g, g4 g g c c2 
  r2 g4 e2 e'4. f8 g2 %tie44
   d2 g,4 b d r4 d, 
  g d r4 g2 d'4 b d 
  d\longa
}

notesVIIIAlto = \relative c {
  R\breve*32

  %33
  \barNumberCheck #33
  r1 r2 a''2 
  a g c1 
  bes2. g4 a2 a 
  a\breve 
  R\breve
  r2 g2 e2. g2. %tie42
    d2 r4 a2 a4 
  d2 b4 g'2 g4. a8 b4 
  r2 r4 e,2. b2 
  r2 c2. e4 c g'2 %tie44
  g4 g2 r2 b, 
  b b2. d4 d2 
  r2 g2. b4 g2 
  R\breve
  r2 c1 g2 
  b b a r4 g 
  g4 b4. a8 g2 f4 g2 
  r2 r4 d2 a c2 %tie44
   g4 c2 r2 f 
  a4. g8 f2 c' r2
  R\breve*16
  
  %69
  \barNumberCheck #69
  r1 g2 g2. %tie2.
   e2 c4 e g r4 g 
  c2. g2 g e4 
  e2 r4 e a2 a4 a2 %tie44
  a4 a2 r1
  r4 g4. d8 d4 r2 d4 g,4. %tie4.
   g'8 g4 g g4. c,8 c4 r2
  r4 d2 a'4. g8 c4 r2 
  c,4. d8 e4 a,2 a' d,4 
  d1 r1
  R\breve*7
  
  %86
  \barNumberCheck #86
  g4 g2 g4 r2 d' 
  d4. b8 b2 r1
  R\breve
  r2 g2. g4 g2 
  g2 c, r1
  R\breve
  r2 a'2. a4 a2 
  a2 b r b 
  c b r b 
  c4 g4. f8 d4 a'2 g 
  R\breve*3
  
  %99
  \barNumberCheck #99
  f4 a4. g8 e4 a2 r2
  R\breve*2
  
  %102
  \barNumberCheck #102
  r2 r4 c4 a4. b8 c2 
  r1 f,4. g8 a4 a 
  a4 a r2 r1
  R\breve*3
  
  %108
  \barNumberCheck #108
  r1 r2 a2. %tie2.
   e2 a, a' e2 %tie44
   f8 g a2 r1
  R\breve*11
  
  %122
  \barNumberCheck #122
  b1. b2 
  b\breve 
  r2 a a a4 a 
  c2 a a1 
  r4 f2 f4 f f a2. %tie2.
   f4 f2 r2 f 
  bes, r4 g'2. g2 
  r1 r4 d4. \ficta bes8 bes g8 
  g4 g'4 g2 r1 
  g4. g8 g4 g b2. g4 
  g2 r4 g c, e r4 e 
  e2 r4 g c, g' g2 
  r2 g c, r
  r4 g'4. b8 b4. g8 g4 r4 d 
  d2 r4 b g2 r4 g'2 %tie44
  d4 g4. a8 b2 g4 b 
  b\breve
}

notesVIIITenor = \relative c {
  R\breve*33

  %34
  \barNumberCheck #34
  r2 e'2 c c 
  g' d4 d e2. e4 
  e1 r1
  R\breve
  r2 b2 c c 
  d2. e4 f1 
  g2 d1 d2 
  g,1 r2 g' 
  g2 g c,2. e4 
  e1 r2 r4 d2 %tie44
  d4. c8 b4 r4 g2 g4 
  g1 r1
  r2 g'1 d2 
  f2 f e4 e2 c4 
  d2. g,4 a4. b8 c4 g2 %tie44
  d'4 b d r4 d2 c4 
  d2. d4 d2 c4 a 
  r4 c e g2 d4 r4 d d 
  f2 c4 c2 bes4 g 
  d'2 r2 r1
  R\breve*16
  
  %70
  \barNumberCheck #70
  r1 r2 e2 
  e2. e4 e1 
  r4 g2 e4 a, c4. c8 c4 
  r2 e4 e4. c8 c4 r4 g'4. %tie4.
   d8 d4. b8 b4 r2 
  b b4. b8 b4 b r4 e2 e4 
  r2 a,4. b8 c4 g b g 
  r4 c2 f4 e2 d4. c8 
  b1 r1
  R\breve*7
  
  %86
  \barNumberCheck #86
  g'4 d2 b4 r2 d 
  d2 r2 r1
  R\breve
  r2 g,2. g4 b2 
  c a r1
  R\breve
  r2 c2. c4 e2 
  f d r2 d 
  e d r2 d 
  e d c b 
  R\breve*3
  
  %99
  \barNumberCheck #99
  r4 a4. b8 c4 f,2 r2
  R\breve*2
  
  %102
  \barNumberCheck #102
  r2 r4 c'4 c2 c 
  r1 d4 a a a4. %tie48
  d,8 a'4 r2 r1
  R\breve*3
  
  %108
  \barNumberCheck #108
  r1 r2 e'1 %tie
   e2 e\breve %tie11
    r1
  R\breve*11
  
  %122
  \barNumberCheck #122
  d1. d2 
  d\breve 
  R\breve
  r2 r4 c2 c4 c2 
  c4 f2 c4 c1 
  c1 r2 r4 bes4. %tie48
  a8 f4 bes2. g4 r4 d'4. %tie4.
   a8 a4. d,8 d4 r4 a' d2 
  r4 g, g2 r2 a 
  b2 b4 b b g d'1 %tie
   b2 e1 
  r2 d4 g, g2 r4 e'2 %tie44
   e4 e e, e4. f8 g4 e 
  r4 g d d'2 b4 r4 g2 %tie44
  g'2 g4. d8 g4 g2 
  r1 g 
  g\breve
}

notesVIIIBaritone = \relative c {
  R\breve*32

  %33
  \barNumberCheck #33
  r1 r2 e2 
  e2 e a1 
  g2 bes a2. a4 
  a\breve 
  r1 r2 d1
   b2 g c1 %tie
   \ficta bes2 c1 
  d2. b4 b2 r4 g2 %tie44
   c2 c,4. d8 e4 r2 
  e4 g2 c, c' g4 
  g1 r2 d1 %tie
   d2 d\breve %tie11
    r2 d'1 %tie
   g,2 b b 
  a1 g2. g4 
  g2 g f g4 e 
  g1 r1
  r2 f d f 
  r2 r4 g2. d4 f2 %tie44
  d4 a'2 r1
  R\breve*17
  
  %70
  \barNumberCheck #70
  e2. g4 g c,2 e2 %tie44
   g4 g c2 g4 g1 %tie
   r2 r2 r4 a4 
  a4 a r4 e4. e8 c4 r2
  r4 d4. d8 d4 r2 d2. %tie2.
   g4 g b g g2 c,4 
  r4 f4. g8 a4 e g2 d4 
  e c2 d4 e c f4. e8 
  d1 r1
  R\breve*7
  
  %86
  \barNumberCheck #86
  g2 d' r2 r4 d4. %tie4.
   g,8 g4 r4 g b g4. f8 d4 
  R\breve
  r2 g2. g4 g2 
  c, c r1
  R\breve
  r2 e2. e4 e2 
  d2 d r2 d4 g2 %tie44
  c,4 d2 r2 d4 g2 %tie44
  c,4 d2 e4 c g'2 
  R\breve*3
  
  %99
  \barNumberCheck #99
  r4 a4 a2 a r2
  R\breve*2
  
  %102
  \barNumberCheck #102
  r1 a4 c2 g4 
  r1 a2 c4 c 
  a4 f r2 r1
  R\breve*3
  
  %108
  \barNumberCheck #108
  r1 r2 a1 %tie
   a2 a\breve %tie11
    r1
  R\breve*11
  
  %122
  \barNumberCheck #122
  d,1. d2 
  d\breve 
  r1 r2 a'2 
  a2 a4 a c2 a 
  a1 r2 a 
  a2 a4 a d2 d 
  r4 d2 g,4 d'1 
  r2 a a r2 
  r4 g4 c2 r4 f, d a' 
  r4 g d2 r2 d2. %tie2.
   d4 d d r4 g c2. %tie2.
   b8 a d2 g, c 
  r4 g e2 g4 c,2 g'4 
  r4 d'4. b8 b4 r2 b 
  b1 r2 g1. %tie21
  g\breve.
}

notesVIIIBass = \relative c {
  R\breve*37

  %38
  \barNumberCheck #38
  r2 g2 c c 
  g'1 f2 a 
  g2. g4 g2 g 
  g1 e4 c g'1 %tie
   c,2 c\breve %tie11
    g1 
  g\breve
  r2 g'1 d2 
  f e d f1 %tie22
  c2 e e 
  d1. e4 c 
  d2 d1 e2 
  f2. g4 a f a2 
  e4 g2 c,4 g'2 r2
  R\breve*17
  
  %69
  \barNumberCheck #69
  r1 g,1 
  c1. c2 
  c\breve
  r2 c a f 
  a1 c2 c 
  g1 r2 g 
  g2 g c c 
  d1 c2 b 
  a2. b4 c2 d 
  g,1 r1
  R\breve*7

  %86
  \barNumberCheck #86
  r2 d'2 d1 
  d\breve 
  R\breve*4
  
  %92
  \barNumberCheck #92
  r2 a2. a4 c2 
  d g, r2 g 
  c g r g 
  c g c4 a e'2 
  R\breve*6
  
  %102
  \barNumberCheck #102
  r2 r4 c4 f2 c 
  f, r4 c' d d a2 
  d2 r2 r1
  R\breve*3
  
  %108
  \barNumberCheck #108
  r1 r2 a1 %tie22 
  a2 a\breve %tie11
    r1
  R\breve*11

  %122
  \barNumberCheck #122 
  g1. g2 
  g\breve 
  r1 r2 f2 
  f2 f4 f a2 f 
  f1 r2 f 
  f2 f4 f bes1. %tie12
  g1 bes2 
  d1. g,2 
  c e d1 
  g, r2 g2. %tie2.
   g4 d'4. f8 e4. d8 c1 %tie
   b2 c g'1 %tie22
  c,2 c1 
  d2 b r4 d2 g,4
  g\longa.
}