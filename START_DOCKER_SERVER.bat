@echo off
title HouseBuilding Server (Docker)
echo Podizanje HouseBuilding servera i PostgreSQL baze...
docker compose up -d --build
start http://localhost:3000
exit