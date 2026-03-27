#!/bin/bash
# Descarga las imagenes del juego desde imgur a ./assets/

mkdir -p assets

echo "Descargando assets..."

curl -sL "https://i.imgur.com/Gv2Oonn.jpeg" -o assets/cesped.jpg
curl -sL "https://i.imgur.com/tTb5gF0.png" -o assets/poste.png
curl -sL "https://i.imgur.com/RnJgsYj.png" -o assets/casa.png
curl -sL "https://i.imgur.com/96kMW1F.png" -o assets/car1.png
curl -sL "https://i.imgur.com/jKJcfh2.png" -o assets/car2.png
curl -sL "https://i.imgur.com/3UzNmve.png" -o assets/car3.png
curl -sL "https://i.imgur.com/AoMHEYe.png" -o assets/car4.png
curl -sL "https://i.imgur.com/R2u46eF.png" -o assets/car5.png
curl -sL "https://i.imgur.com/DFYNede.png" -o assets/car6.png
curl -sL "https://i.imgur.com/ZeqL32w.png" -o assets/guanaco_up.png
curl -sL "https://i.imgur.com/X9YQ983.png" -o assets/guanaco_down.png
curl -sL "https://i.imgur.com/ZD08VD0.png" -o assets/guanaco_left.png
curl -sL "https://i.imgur.com/hNaeB4b.png" -o assets/guanaco_right.png

echo "Descarga completa. Assets en ./assets/"
ls -la assets/
