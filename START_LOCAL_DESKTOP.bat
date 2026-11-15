@echo off
title HouseBuilding Desktop
echo Pokretanje HouseBuilding sistema...
if not exist "node_modules" (
    echo Prvo pokretanje - instalacija komponenti...
    call npm install --production
    call npx prisma generate
)
start "" /b node desktop_launcher.js
exit