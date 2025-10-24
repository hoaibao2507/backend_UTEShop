@echo off
:loop
echo Starting LocalTunnel...
lt --port 3001 --subdomain giftshop-api
echo Tunnel closed. Restarting in 5 seconds...
timeout /t 5
goto loop
