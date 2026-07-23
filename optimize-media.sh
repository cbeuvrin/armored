#!/bin/bash
# Re-encodea los videos servidos en produccion hacia media/.
# Los originales no se tocan. Todos los videos son loops decorativos
# con muted en el HTML, por eso se elimina la pista de audio (-an).
set -e

cd "$(dirname "$0")"
mkdir -p media/niveles media/servicios media/hero media/parallax

# $1 origen  $2 destino  $3 filtro de escala  $4 crf
enc() {
    echo "  $2"
    ffmpeg -y -v error -i "$1" -an \
        -c:v libx264 -crf "$4" -preset slow -profile:v high -pix_fmt yuv420p \
        -vf "$3" -movflags +faststart "$2"
}

# Seccion NIVELES: 4 verticales en grid, con brightness(0.5) encima.
echo "NIVELES"
enc "video blindaje/12 MM tiktok armored-web.mp4" media/niveles/12mm.mp4  "scale=-2:960" 32
enc "video blindaje/17 mm-web.mp4"                media/niveles/17mm.mp4  "scale=-2:960" 32
enc "video blindaje/37 mm -web.mp4"               media/niveles/37mm.mp4  "scale=-2:960" 32
enc "video blindaje/ak47-web.mp4"                 media/niveles/ak47.mp4  "scale=-2:960" 32

# SERVICIOS: horizontales a ancho completo. empresario tambien es el hero
# de escritorio, por eso lleva mas resolucion y menos crf que los demas.
echo "SERVICIOS"
enc "videos-servicios/video-empresario-web.mp4" media/servicios/empresario.mp4 "scale=1600:-2" 28
enc "videos-servicios/video-gobierno-web.mp4"   media/servicios/gobierno.mp4   "scale=1280:-2" 30
enc "videos-servicios/video-particular-web.mp4" media/servicios/particular.mp4 "scale=1280:-2" 30

# Variantes verticales de servicios para movil.
enc "video-hero-movil/14.mp4" media/servicios/gobierno-movil.mp4   "scale=-2:960" 30
enc "video-hero-movil/15.mp4" media/servicios/empresario-movil.mp4 "scale=-2:960" 30
enc "video-hero-movil/16.mp4" media/servicios/particular-movil.mp4 "scale=-2:960" 30

# HERO y fondos de seccion.
echo "HERO"
enc "video-hero-movil/section-3-video.mp4" media/hero/section-3.mp4 "scale=-2:960" 30
cp "video-hero-movil/video-hero-mobile-web.mp4" media/hero/hero-mobile.mp4  # ya pesa 276K

# Parallax de fondo.
echo "PARALLAX"
enc "VIDEOS NIVELES/Black_armored_car_rolling_city_delpmaspu_.mp4" media/parallax/armored-city.mp4 "scale=1280:-2" 30
enc "VIDEOS NIVELES/Nivel2.mp4"                                    media/parallax/nivel2.mp4       "scale=1280:-2" 30

echo
echo "Listo. Antes/despues:"
du -sh media
