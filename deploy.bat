@echo off
setlocal

git config remote.origin.url > deploy.bat.temp
set /p GITURL= < deploy.bat.temp
del deploy.bat.temp

npm run build | rem
cd out
rd /s /q .git\
git init
echo %GITURL%
git remote add origin %GITURL%
git add .
git commit -am "latest deploy"
git push origin main:gh-pages --force
