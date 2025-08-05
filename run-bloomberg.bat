@echo off
cd /d C:\Users\AMD\.local\bin\alpha-terminal
set COINGECKO_PRO_API_KEY=CG-MVg68aVqeVyu8fzagC9E1hPj
set PORT=3337
echo Starting Bloomberg Pro Server...
node bloomberg-pro-server.js
pause