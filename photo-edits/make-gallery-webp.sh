#!/bin/zsh
# Builds the four gallery images from the approved, unwatermarked PNGs in enhanced/ at their FULL native resolution,
# with the small Skee logo watermark in the bottom-right corner:
#   - app/src/assets/gallery/*.webp  (what the website serves, quality 90)
#   - photo-edits/final/*.png        (high-resolution watermarked masters, committed to the repository)
# Usage: make-gallery-webp.sh [white|black] [webp-output-dir]
# The unwatermarked originals in enhanced/ are never modified (they stay on the owner's Mac, not in the repository).
set -e
cd "${0:A:h}"
COLOR=${1:-white}
OUT=${2:-../app/src/assets/gallery}
MASTERS=final
FFMPEG=/Users/mac/.npm-global/bin/ffmpeg
FFPROBE=/Users/mac/.npm-global/bin/ffprobe
LOGO="../brand/visual identity/White 3KEE Graffiti Logo.png"
# Size and spot from the box the user drew, as fractions of the photo: width 165/960, right margin 19/960, bottom margin 24/1200.

case $COLOR in
  black) LUT="lutrgb=r=0:g=0:b=0" ;;
  white) LUT="null" ;;
  *) echo "color must be white or black"; exit 1 ;;
esac
mkdir -p "$OUT" "$MASTERS"

build() {
  local src="enhanced/$2"
  local w=$("$FFPROBE" -v error -select_streams v:0 -show_entries stream=width -of csv=p=0 "$src")
  local h=$("$FFPROBE" -v error -select_streams v:0 -show_entries stream=height -of csv=p=0 "$src")
  local wm=$(( w * 165 / 960 )) mx=$(( w * 19 / 960 )) my=$(( h * 24 / 1200 ))
  "$FFMPEG" -hide_banner -loglevel error -y -i "$src" -i "$LOGO" -filter_complex \
    "[1]crop=1310:783:245:79,format=rgba,$LUT,scale=$wm:-1:flags=lanczos[wm];[0][wm]overlay=W-w-$mx:H-h-$my:format=auto" \
    -frames:v 1 "$MASTERS/$1.png"
  "$FFMPEG" -hide_banner -loglevel error -y -i "$MASTERS/$1.png" -c:v libwebp -quality 90 -compression_level 6 "$OUT/$1.webp"
  echo "$1: ${w}x${h}, logo ${wm}px"
}

build curtain-taper IMG_4120-enhanced.png
build swept-taper IMG_2664-enhanced.png
build textured-taper IMG_2991-enhanced.png
build curly-taper IMG_3665-enhanced.png
ls -la "$OUT" "$MASTERS"
