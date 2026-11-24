@echo off
chcp 65001 > nul
echo [직원 사전 휴무 계획표] 웹 애플리케이션을 실행합니다...
start "" "%~dp0employee_schedule.html"
exit
