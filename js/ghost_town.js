var ghostX = -80;
function stepGhost() {
  ghostX += 1.7;
  if (ghostX > 2000) ghostX = -80;
  return ghostX;
}
