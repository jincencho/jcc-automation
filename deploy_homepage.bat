@echo off
echo [Homepage Automation] Committing and Deploying...
cd web
git add .
git commit -m "Homepage automatic update"
cmd /c vercel --prod --yes
echo [Done] Homepage updated at https://jcc-band.vercel.app
pause
