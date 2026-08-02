#!/bin/sh

lang=$(whiptail --title "Language Selection" --radiolist \
"使用する言語を選択してください :" 15 50 3 \
"ja" "日本語" ON \
"en" "English" OFF \
3>&1 1>&2 2>&3)